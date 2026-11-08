import { Scholarship, CoverageType, FundingBasis } from '../types';

export interface GeographicRegion {
  id: string;
  label: string;
  countries: string[];
}

export const GEOGRAPHIC_REGIONS: GeographicRegion[] = [
  { id: 'uk', label: 'UK & Ireland', countries: ['United Kingdom'] },
  { id: 'europe', label: 'Continental Europe', countries: ['Germany', 'France', 'Italy', 'Finland', 'Sweden'] },
  { id: 'north_america', label: 'North America', countries: ['United States', 'Canada'] },
  { id: 'asia_pacific', label: 'Asia-Pacific', countries: ['Japan', 'Australia'] },
  { id: 'global', label: 'Multi-Destination', countries: [] },
];

export function isScholarshipInRegion(scholarship: Scholarship, regionId: string): boolean {
  if (regionId === 'global') {
    return scholarship.destinationCountries.length >= 3;
  }
  const region = GEOGRAPHIC_REGIONS.find((r) => r.id === regionId);
  if (!region) return false;
  return scholarship.destinationCountries.some((c) => region.countries.includes(c));
}

export type FundingBasisFilter = 'all' | 'merit' | 'need';

export interface CoverageTypeOption {
  id: CoverageType;
  label: string;
}

export const COVERAGE_TYPE_OPTIONS: CoverageTypeOption[] = [
  { id: 'full_ride', label: 'Full Ride' },
  { id: 'full_tuition', label: 'Full Tuition' },
  { id: 'stipend', label: 'Living Stipend' },
  { id: 'travel', label: 'Travel / Airfare' },
  { id: 'health', label: 'Health Coverage' },
];

export function getScholarshipFundingNature(scholarship: Scholarship): FundingBasis[] {
  if (scholarship.fundingNature && scholarship.fundingNature.length > 0) {
    return scholarship.fundingNature;
  }
  const isNeed = scholarship.criteria.some(
    (c) =>
      c.title.toLowerCase().includes('need') ||
      c.description.toLowerCase().includes('afford') ||
      c.description.toLowerCase().includes('financial'),
  );
  return isNeed ? ['merit', 'need'] : ['merit'];
}

export interface DeadlineProximityOption {
  id: string;
  label: string;
  shortLabel: string;
  match: (daysRemaining: number) => boolean;
}

export const DEADLINE_PROXIMITY_OPTIONS: DeadlineProximityOption[] = [
  {
    id: 'all',
    label: 'All deadlines (any time)',
    shortLabel: 'Any time',
    match: () => true,
  },
  {
    id: 'urgent_14d',
    label: 'Closing soon (< 14 days)',
    shortLabel: '< 14 days',
    match: (days) => days > 0 && days <= 14,
  },
  {
    id: 'urgent_30d',
    label: 'Due within 30 days',
    shortLabel: '≤ 30 days',
    match: (days) => days > 0 && days <= 30,
  },
  {
    id: '1_3_months',
    label: '1–3 months (30–90 days)',
    shortLabel: '1–3 months',
    match: (days) => days > 30 && days <= 90,
  },
  {
    id: '3_6_months',
    label: '3–6 months (90–180 days)',
    shortLabel: '3–6 months',
    match: (days) => days > 90 && days <= 180,
  },
  {
    id: '6_plus_months',
    label: '6+ months (open / later cycles)',
    shortLabel: '6+ months',
    match: (days) => days > 180,
  },
];
