import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AuthRequestError,
  clearAuthToken,
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  readAuthToken,
  registerAccount,
  storeAuthToken,
  type AuthSession,
} from '../services/authService';
import { AuthUser, StudentProfile, SavedScholarship, TrackerStatus } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function createEmptyProfile(user: AuthUser | null): StudentProfile {
  const now = new Date().toISOString();
  return {
    uid: user ? String(user.id) : 'guest',
    email: user?.email ?? '',
    displayName: user?.displayName ?? '',
    photoURL: user?.photoURL,
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

/**
 * Keep guest answers when someone signs in, but never show one account's
 * profile to a different account on the same device.
 */
function applyUserToProfile(previous: StudentProfile | null, user: AuthUser): StudentProfile {
  const uid = String(user.id);
  const belongsToUser = previous?.uid === uid;
  const isGuestProfile = !previous?.uid || previous.uid === 'guest';

  if (previous && !belongsToUser && !isGuestProfile) {
    return createEmptyProfile(user);
  }

  const base = previous ?? createEmptyProfile(user);
  return {
    ...base,
    uid,
    email: user.email || base.email,
    displayName: base.displayName || user.displayName,
    photoURL: user.photoURL ?? base.photoURL,
    updatedAt: new Date().toISOString(),
  };
}

interface SignUpInput {
  email: string;
  password: string;
  displayName?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  savedScholarships: SavedScholarship[];
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  saveScholarship: (
    scholarshipId: string,
    metadata: { title: string; provider: string; destination: string; awardValue: string; deadline: string | null },
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(() =>
    safeParse<StudentProfile>(localStorage.getItem('scholarfind_profile')),
  );
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarship[]>(() => {
    const parsed = safeParse<SavedScholarship[]>(localStorage.getItem('scholarfind_saved'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const legacyRecord = SCHOLARSHIPS_DATA.find((scholarship) => scholarship.id === item.scholarshipId);
      return legacyRecord ? { ...item, scholarshipId: legacyRecord.slug } : item;
    });
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => readAuthToken());

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

  // Validate any stored token once on boot. An invalid/revoked token is cleared
  // so the UI falls back to guest mode instead of pretending to be signed in.
  useEffect(() => {
    const stored = readAuthToken();
    if (!stored) {
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const user = await fetchCurrentUser(stored);
        if (!active) return;
        setToken(stored);
        setCurrentUser(user);
        setProfile((previous) => applyUserToProfile(previous, user));
      } catch {
        clearAuthToken();
        if (active) setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const acceptSession = (session: AuthSession) => {
    storeAuthToken(session.token);
    setToken(session.token);
    setCurrentUser(session.user);
    setProfile((previous) => applyUserToProfile(previous, session.user));
    setAuthError(null);
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      acceptSession(await loginAccount(email, password));
    } catch (error) {
      const message =
        error instanceof AuthRequestError
          ? error.message
          : 'Sign in failed. Please try again.';
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const signUp = async ({ email, password, displayName }: SignUpInput) => {
    setAuthError(null);
    try {
      acceptSession(
        await registerAccount({
          email,
          password,
          passwordConfirm: password,
          displayName,
        }),
      );
    } catch (error) {
      const message =
        error instanceof AuthRequestError
          ? error.message
          : 'Could not create your account. Please try again.';
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const signOut = async () => {
    const currentToken = token;

    clearAuthToken();
    setToken(null);
    setCurrentUser(null);
    setProfile(null);
    setSavedScholarships([]);
    setAuthError(null);
    try {
      localStorage.removeItem('scholarfind_profile');
      localStorage.removeItem('scholarfind_saved');
    } catch {
      /* ignore storage failures */
    }

    if (currentToken) {
      try {
        await logoutAccount(currentToken);
      } catch (error) {
        // The local token is already cleared; a failed server revoke should not
        // trap the user in a signed-in state.
        console.warn('Server sign-out failed; the local session was cleared.', error);
      }
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
  };

  const saveScholarship = async (
    scholarshipId: string,
    metadata: { title: string; provider: string; destination: string; awardValue: string; deadline: string | null },
  ) => {
    if (savedScholarships.some((s) => s.scholarshipId === scholarshipId)) return;

    const newSaved: SavedScholarship = {
      id: scholarshipId,
      userId: currentUser ? String(currentUser.id) : 'guest',
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
  };

  const unsaveScholarship = async (scholarshipId: string) => {
    setSavedScholarships((prev) => prev.filter((s) => s.scholarshipId !== scholarshipId));
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
  };

  const isSaved = (scholarshipId: string) =>
    savedScholarships.some((s) => s.scholarshipId === scholarshipId);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        savedScholarships,
        authError,
        signIn,
        signUp,
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
