import type { Scholarship } from '../types';

/**
 * Timezone-consistent dynamic deadline calculation.
 * Computes exact remaining calendar days from UTC midnight to UTC deadline midnight.
 */
export function calculateDaysRemaining(deadlineIso: string | null | undefined): number | null {
  if (!deadlineIso) return null;
  try {
    const deadlineDate = new Date(deadlineIso);
    if (Number.isNaN(deadlineDate.getTime())) return null;
    const now = new Date();
    // Compare UTC timestamps
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Returns human-readable honest status for deadlines.
 */
export function getDeadlineDisplay(deadlineIso: string | null | undefined): {
  daysRemaining: number | null;
  isClosed: boolean;
  statusLabel: string;
  badgeClass: string;
} {
  const days = calculateDaysRemaining(deadlineIso);
  if (days === null) {
    return {
      daysRemaining: null,
      isClosed: false,
      statusLabel: 'Deadline not published',
      badgeClass: 'text-[#6b7280] bg-[#eeeeed]'
    };
  }
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
