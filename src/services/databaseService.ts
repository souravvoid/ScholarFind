import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Scholarship, IngestionSource } from '../types';
import { SCHOLARSHIPS_DATA } from '../data/scholarshipsData';
import { INGESTION_SOURCES } from '../data/sourcesData';

/**
 * Timezone-consistent dynamic deadline calculation.
 * Computes exact remaining calendar days from UTC midnight to UTC deadline midnight.
 */
export function calculateDaysRemaining(deadlineIso: string): number {
  if (!deadlineIso) return 0;
  try {
    const deadlineDate = new Date(deadlineIso);
    const now = new Date();
    // Compare UTC timestamps
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Returns human-readable honest status for deadlines.
 */
export function getDeadlineDisplay(deadlineIso: string): {
  daysRemaining: number;
  isClosed: boolean;
  statusLabel: string;
  badgeClass: string;
} {
  const days = calculateDaysRemaining(deadlineIso);
  if (days < 0) {
    return {
      daysRemaining: 0,
      isClosed: true,
      statusLabel: 'Cycle closed (Auditing next intake)',
      badgeClass: 'text-[#6b7280] bg-[#eeeeed]'
    };
  } else if (days === 0) {
    return {
      daysRemaining: 0,
      isClosed: false,
      statusLabel: 'Closes today at 23:59 UTC',
      badgeClass: 'text-[#ba1a1a] bg-[#ffdad6]'
    };
  } else if (days <= 14) {
    return {
      daysRemaining: days,
      isClosed: false,
      statusLabel: `${days} days remaining (Urgent)`,
      badgeClass: 'text-[#ba1a1a] bg-[#ffdad6]'
    };
  } else if (days <= 60) {
    return {
      daysRemaining: days,
      isClosed: false,
      statusLabel: `${days} days remaining in cycle`,
      badgeClass: 'text-[#b45309] bg-[#fef3c7]'
    };
  } else {
    return {
      daysRemaining: days,
      isClosed: false,
      statusLabel: `${days} days remaining in cycle`,
      badgeClass: 'text-[#047857] bg-[#ecfdf5]'
    };
  }
}

/**
 * Normalizes scholarship record with live calculated dates
 */
export function normalizeScholarshipWithCurrentDates(scholarship: Scholarship): Scholarship {
  const days = calculateDaysRemaining(scholarship.applicationDeadline);
  return {
    ...scholarship,
    daysRemaining: days
  };
}

/** Minimal shape validation: Firestore docs are untrusted input (cast is not validation). */
function isValidScholarship(item: Partial<Scholarship> | undefined): item is Scholarship {
  return !!(item &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.title === 'string' && item.title.length > 0 &&
    typeof item.officialSourceUrl === 'string' &&
    typeof item.applicationDeadline === 'string' &&
    typeof item.overview === 'string' &&
    Array.isArray(item.fieldsOfStudy ?? item.criteria));
}

function isValidSource(item: Partial<IngestionSource> | undefined): item is IngestionSource {
  return !!(item &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.name === 'string' && item.name.length > 0 &&
    typeof item.provenanceUrl === 'string');
}

/**
 * Fetches all verified scholarships directly from the live Firestore database.
 * Falls back safely to the verified static baseline when the collection is empty
 * or unreachable (catalogue writes happen via a service identity, not this client).
 */
export async function getScholarshipsFromDatabase(): Promise<{
  data: Scholarship[];
  fromDatabase: boolean;
  error?: string;
}> {
  try {
    const colRef = collection(db, 'scholarships');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return {
        data: SCHOLARSHIPS_DATA.map(normalizeScholarshipWithCurrentDates),
        fromDatabase: false,
        error: 'Catalogue collection is empty; using verified static baseline.'
      };
    }

    const list: Scholarship[] = [];
    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      if (isValidScholarship(item)) {
        list.push(normalizeScholarshipWithCurrentDates(item));
      } else {
        console.warn(`Skipping malformed scholarship document "${docSnap.id}" (failed shape validation).`);
      }
    });

    if (list.length === 0) {
      return {
        data: SCHOLARSHIPS_DATA.map(normalizeScholarshipWithCurrentDates),
        fromDatabase: false,
        error: 'No valid catalogue documents; using verified static baseline.'
      };
    }

    return { data: list, fromDatabase: true };
  } catch (error) {
    console.warn('Could not query scholarships from Firestore database. Falling back to local verified cache:', error);
    const fallback = SCHOLARSHIPS_DATA.map(normalizeScholarshipWithCurrentDates);
    return { 
      data: fallback, 
      fromDatabase: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Fetches the approved sources from Firestore database with static fallback.
 */
export async function getSourcesFromDatabase(): Promise<{
  data: IngestionSource[];
  fromDatabase: boolean;
  error?: string;
}> {
  try {
    const colRef = collection(db, 'scholarship_sources');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return { data: INGESTION_SOURCES, fromDatabase: false };
    }

    const list: IngestionSource[] = [];
    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      if (isValidSource(item)) {
        list.push(item);
      } else {
        console.warn(`Skipping malformed source document "${docSnap.id}" (failed shape validation).`);
      }
    });

    if (list.length === 0) {
      return { data: INGESTION_SOURCES, fromDatabase: false };
    }

    return { data: list, fromDatabase: true };
  } catch (error) {
    console.warn('Could not query sources from Firestore database:', error);
    return { 
      data: INGESTION_SOURCES, 
      fromDatabase: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
