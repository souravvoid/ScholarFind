import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { StudentProfile, SavedScholarship, TrackerStatus } from '../types';

export const INITIAL_SAMPLE_PROFILE: StudentProfile = {
  uid: 'demo_scholar_amara',
  email: 'amara.okafor@alumni.ui.edu.ng',
  displayName: 'Amara Okafor',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  citizenship: 'Nigeria',
  residenceCountry: 'Nigeria',
  educationLevel: 'bachelors',
  institution: 'University of Ibadan (Nigeria)',
  gradingScale: 'gpa_4_0',
  gpa: 3.82,
  maxGpa: 4.0,
  graduationYear: '2025 (Expected)',
  primaryField: 'Computer Science & Artificial Intelligence (STEM)',
  facultyTags: ['Computer Science', 'Machine Learning', 'STEM'],
  researchKeywords: ['Machine Learning', 'Natural Language Processing', 'Data Ethics & Algorithmic Fairness'],
  targetDegrees: ['masters', 'phd'],
  targetRegions: ['Western & Northern Europe', 'North America'],
  targetCountries: ['United Kingdom', 'Germany', 'Canada', 'United States', 'Netherlands'],
  deliveryModality: 'on_campus',
  intendedStartTerm: 'Fall 2025',
  workExperienceYears: 2,
  englishTestType: 'none',
  englishScore: '',
  hasEnglishMediumInstruction: true,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
};

interface AuthContextType {
  currentUser: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  savedScholarships: SavedScholarship[];
  signInWithGoogle: () => Promise<void>;
  signInDemoUser: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  saveScholarship: (scholarshipId: string, metadata: {
    title: string;
    provider: string;
    destination: string;
    awardValue: string;
    deadline: string;
  }) => Promise<void>;
  unsaveScholarship: (scholarshipId: string) => Promise<void>;
  updateTrackerStatus: (scholarshipId: string, status: TrackerStatus, notes?: string, completedDocs?: string[]) => Promise<void>;
  isSaved: (scholarshipId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    // Check localStorage fallback for immediate responsiveness
    const saved = localStorage.getItem('scholarfind_profile');
    return saved ? JSON.parse(saved) : INITIAL_SAMPLE_PROFILE;
  });
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarship[]>(() => {
    const saved = localStorage.getItem('scholarfind_saved');
    return saved ? JSON.parse(saved) : [
      {
        id: 'gates-cambridge',
        userId: 'demo_scholar_amara',
        scholarshipId: 'gates-cambridge',
        scholarshipTitle: 'Gates Cambridge Scholarship',
        provider: 'University of Cambridge',
        destination: 'United Kingdom',
        awardValue: 'Full tuition + £20,000/yr',
        deadline: 'Dec 04, 2025',
        status: 'preparing' as TrackerStatus,
        completedDocs: ['Official Academic Transcripts (Certified English translation)'],
        notes: 'Refining personal leadership essay focusing on health data fairness.',
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'commonwealth-masters',
        userId: 'demo_scholar_amara',
        scholarshipId: 'commonwealth-masters',
        scholarshipTitle: 'Commonwealth Master’s Scholarship 2025/26',
        provider: 'Commonwealth Scholarship Commission',
        destination: 'United Kingdom',
        awardValue: 'Full tuition + £1,347/mo',
        deadline: 'Dec 12, 2025',
        status: 'interested' as TrackerStatus,
        completedDocs: [],
        notes: 'Awaiting nomination portal release.',
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem('scholarfind_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('scholarfind_saved', JSON.stringify(savedScholarships));
  }, [savedScholarships]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or create profile in Firestore
        const profileRef = doc(db, 'users', user.uid, 'profile', 'data');
        try {
          const snapshot = await getDoc(profileRef);
          if (snapshot.exists()) {
            setProfile(snapshot.data() as StudentProfile);
          } else {
            // Seed profile for new authenticated user
            const newProfile: StudentProfile = {
              ...INITIAL_SAMPLE_PROFILE,
              uid: user.uid,
              email: user.email || 'user@scholarfind.org',
              displayName: user.displayName || 'ScholarFind Fellow',
              photoURL: user.photoURL || undefined,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.warn('Could not read user profile from Firestore, using cached/local state:', error);
        }

        // Attach listener for user's saved scholarships
        const savedCol = collection(db, 'users', user.uid, 'saved_scholarships');
        const unsubSaved = onSnapshot(
          savedCol,
          (snapshot) => {
            const list: SavedScholarship[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as SavedScholarship);
            });
            if (list.length > 0) {
              setSavedScholarships(list);
            }
          },
          (err) => {
            console.warn('Snapshot error on saved scholarships:', err);
          }
        );

        setLoading(false);
        return () => unsubSaved();
      } else {
        // Unauthenticated - keep demo profile active so the user can interactively test the matching engine immediately
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Google sign-in popup failed or was blocked by browser:', error);
      // Fallback: If in restricted iframe or popup blocked, activate demo authenticated state
      signInDemoUser();
    }
  };

  const signInDemoUser = () => {
    setProfile(INITIAL_SAMPLE_PROFILE);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(null);
  };

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    const updated = {
      ...(profile || INITIAL_SAMPLE_PROFILE),
      ...updates,
      updatedAt: new Date().toISOString()
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

  const saveScholarship = async (scholarshipId: string, metadata: {
    title: string;
    provider: string;
    destination: string;
    awardValue: string;
    deadline: string;
  }) => {
    const existing = savedScholarships.find(s => s.scholarshipId === scholarshipId);
    if (existing) return;

    const newSaved: SavedScholarship = {
      id: scholarshipId,
      userId: currentUser?.uid || 'demo_scholar_amara',
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
      updatedAt: new Date().toISOString()
    };

    setSavedScholarships(prev => [newSaved, ...prev]);

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
    setSavedScholarships(prev => prev.filter(s => s.scholarshipId !== scholarshipId));

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
    completedDocs?: string[]
  ) => {
    setSavedScholarships(prev => prev.map(s => {
      if (s.scholarshipId === scholarshipId) {
        return {
          ...s,
          status,
          ...(notes !== undefined ? { notes } : {}),
          ...(completedDocs !== undefined ? { completedDocs } : {}),
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    if (currentUser) {
      const savePath = `users/${currentUser.uid}/saved_scholarships/${scholarshipId}`;
      try {
        const item = savedScholarships.find(s => s.scholarshipId === scholarshipId);
        if (item) {
          const payload = {
            ...item,
            status,
            ...(notes !== undefined ? { notes } : {}),
            ...(completedDocs !== undefined ? { completedDocs } : {}),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', currentUser.uid, 'saved_scholarships', scholarshipId), payload, { merge: true });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, savePath);
      }
    }
  };

  const isSaved = (scholarshipId: string) => {
    return savedScholarships.some(s => s.scholarshipId === scholarshipId);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      profile,
      loading,
      savedScholarships,
      signInWithGoogle,
      signInDemoUser,
      signOut,
      updateProfile,
      saveScholarship,
      unsaveScholarship,
      updateTrackerStatus,
      isSaved
    }}>
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
