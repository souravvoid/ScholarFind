import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { StudentProfile, SavedScholarship, TrackerStatus } from '../types';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function createEmptyProfile(user: User | null): StudentProfile {
  const now = new Date().toISOString();
  return {
    uid: user?.uid ?? 'guest',
    email: user?.email ?? '',
    displayName: user?.displayName ?? '',
    photoURL: user?.photoURL ?? undefined,
    citizenship: '',
    residenceCountry: '',
    educationLevel: 'bachelors',
    institution: '',
    gradingScale: 'gpa_4_0',
    gpa: 0,
    maxGpa: 4.0,
    graduationYear: '',
    primaryField: '',
    facultyTags: [],
    researchKeywords: [],
    targetDegrees: [],
    targetRegions: [],
    targetCountries: [],
    deliveryModality: 'on_campus',
    intendedStartTerm: '',
    workExperienceYears: 0,
    englishTestType: 'none',
    englishScore: '',
    hasEnglishMediumInstruction: false,
    updatedAt: now,
    createdAt: now,
  };
}

interface AuthContextType {
  currentUser: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  savedScholarships: SavedScholarship[];
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  saveScholarship: (
    scholarshipId: string,
    metadata: { title: string; provider: string; destination: string; awardValue: string; deadline: string },
  ) => Promise<void>;
  unsaveScholarship: (scholarshipId: string) => Promise<void>;
  updateTrackerStatus: (
    scholarshipId: string,
    status: TrackerStatus,
    notes?: string,
    completedDocs?: string[],
  ) => Promise<void>;
  isSaved: (scholarshipId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(() =>
    safeParse<StudentProfile>(localStorage.getItem('scholarfind_profile')),
  );
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarship[]>(() => {
    const parsed = safeParse<SavedScholarship[]>(localStorage.getItem('scholarfind_saved'));
    return Array.isArray(parsed) ? parsed : [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Keep a ref so async writes never read a stale closure.
  const savedRef = useRef(savedScholarships);
  useEffect(() => {
    savedRef.current = savedScholarships;
  }, [savedScholarships]);

  // Persist profile only when one exists (guests and signed-in users share this device store).
  useEffect(() => {
    if (profile) {
      try {
        localStorage.setItem('scholarfind_profile', JSON.stringify(profile));
      } catch {
        /* ignore storage failures */
      }
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('scholarfind_saved', JSON.stringify(savedScholarships));
    } catch {
      /* ignore storage failures */
    }
  }, [savedScholarships]);

  // Firebase Auth listener. A single saved-scholarships listener is attached per signed-in user
  // and detached on sign-out / re-auth to avoid leaks.
  useEffect(() => {
    let unsubSaved: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubSaved?.();
      unsubSaved = null;
      setCurrentUser(user);
      setAuthError(null);

      if (user) {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'data');
        try {
          const snapshot = await getDoc(profileRef);
          if (snapshot.exists()) {
            setProfile(snapshot.data() as StudentProfile);
          } else {
            const newProfile = createEmptyProfile(user);
            try {
              await setDoc(profileRef, newProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/profile/data`);
            }
            setProfile(newProfile);
          }
        } catch (error) {
          console.warn('Could not read user profile from Firestore; keeping cached state:', error);
        }

        const savedCol = collection(db, 'users', user.uid, 'saved_scholarships');
        unsubSaved = onSnapshot(
          savedCol,
          (snapshot) => {
            const list: SavedScholarship[] = snapshot.docs.map((d) => d.data() as SavedScholarship);
            setSavedScholarships(list); // empty snapshot clears the UI (no ghost rows)
          },
          (err) => {
            console.warn('Snapshot error on saved scholarships:', err);
          },
        );

        setLoading(false);
      } else {
        // Unauthenticated: device-local state (already loaded from localStorage) stays as-is.
        setLoading(false);
      }
    });

    return () => {
      unsubSaved?.();
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Google sign-in popup failed or was blocked by browser:', error);
      setAuthError('Sign-in was cancelled or blocked. You can keep using ScholarFind on this device.');
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
    // Clear all user residue from state and device storage (B-07).
    setCurrentUser(null);
    setProfile(null);
    setSavedScholarships([]);
    try {
      localStorage.removeItem('scholarfind_profile');
      localStorage.removeItem('scholarfind_saved');
    } catch {
      /* ignore storage failures */
    }
  };

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    const base = profile ?? createEmptyProfile(currentUser);
    const updated: StudentProfile = {
      ...base,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);

    if (currentUser) {
      const profilePath = `users/${currentUser.uid}/profile/data`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'), updated, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, profilePath);
      }
    }
  };

  const saveScholarship = async (
    scholarshipId: string,
    metadata: { title: string; provider: string; destination: string; awardValue: string; deadline: string },
  ) => {
    if (savedScholarships.some((s) => s.scholarshipId === scholarshipId)) return;

    const newSaved: SavedScholarship = {
      id: scholarshipId,
      userId: currentUser?.uid ?? 'guest',
      scholarshipId,
      scholarshipTitle: metadata.title,
      provider: metadata.provider,
      destination: metadata.destination,
      awardValue: metadata.awardValue,
      deadline: metadata.deadline,
      status: 'interested',
      completedDocs: [],
      notes: '',
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedScholarships((prev) => [newSaved, ...prev]);

    if (currentUser) {
      const savePath = `users/${currentUser.uid}/saved_scholarships/${scholarshipId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'saved_scholarships', scholarshipId), newSaved);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, savePath);
      }
    }
  };

  const unsaveScholarship = async (scholarshipId: string) => {
    setSavedScholarships((prev) => prev.filter((s) => s.scholarshipId !== scholarshipId));

    if (currentUser) {
      const savePath = `users/${currentUser.uid}/saved_scholarships/${scholarshipId}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'saved_scholarships', scholarshipId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, savePath);
      }
    }
  };

  const updateTrackerStatus = async (
    scholarshipId: string,
    status: TrackerStatus,
    notes?: string,
    completedDocs?: string[],
  ) => {
    const current = savedRef.current.find((s) => s.scholarshipId === scholarshipId);
    if (!current) return;

    const payload: SavedScholarship = {
      ...current,
      status,
      ...(notes !== undefined ? { notes } : {}),
      ...(completedDocs !== undefined ? { completedDocs } : {}),
      updatedAt: new Date().toISOString(),
    };

    setSavedScholarships((prev) =>
      prev.map((s) => (s.scholarshipId === scholarshipId ? payload : s)),
    );

    if (currentUser) {
      const savePath = `users/${currentUser.uid}/saved_scholarships/${scholarshipId}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'saved_scholarships', scholarshipId), payload, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, savePath);
      }
    }
  };

  const isSaved = (scholarshipId: string) => savedScholarships.some((s) => s.scholarshipId === scholarshipId);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        savedScholarships,
        authError,
        signInWithGoogle,
        signOut,
        updateProfile,
        saveScholarship,
        unsaveScholarship,
        updateTrackerStatus,
        isSaved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
