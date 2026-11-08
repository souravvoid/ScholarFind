/**
 * Normalization Engine for ScholarFind Frontend Ingestion
 * Handles Dates (ISO-8601 UTC + Days remaining), Currencies (ISO 4217 + USD Parity),
 * Countries (Canonical ISO naming), and Education Levels.
 */

import { DegreeLevel, CriterionRuleType, EligibilityCriterion } from '../../types';
import { RawApiScholarshipPayload } from './types';

export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  GBP: 1.30,
  EUR: 1.08,
  CAD: 0.74,
  AUD: 0.66,
  JPY: 0.0067,
  SEK: 0.095,
  CHF: 1.15
};

export const CANONICAL_COUNTRIES: Record<string, { name: string; flag: string }> = {
  'uk': { name: 'United Kingdom', flag: '🇬🇧' },
  'united kingdom': { name: 'United Kingdom', flag: '🇬🇧' },
  'great britain': { name: 'United Kingdom', flag: '🇬🇧' },
  'england': { name: 'United Kingdom', flag: '🇬🇧' },
  'germany': { name: 'Germany', flag: '🇩🇪' },
  'deutschland': { name: 'Germany', flag: '🇩🇪' },
  'de': { name: 'Germany', flag: '🇩🇪' },
  'us': { name: 'United States', flag: '🇺🇸' },
  'usa': { name: 'United States', flag: '🇺🇸' },
  'united states': { name: 'United States', flag: '🇺🇸' },
  'canada': { name: 'Canada', flag: '🇨🇦' },
  'australia': { name: 'Australia', flag: '🇦🇺' },
  'japan': { name: 'Japan', flag: '🇯🇵' },
  'sweden': { name: 'Sweden', flag: '🇸🇪' },
  'france': { name: 'France', flag: '🇫🇷' }
};

/**
 * Normalizes raw date strings into standard UTC ISO-8601 format (YYYY-MM-DD).
 */
export function normalizeDate(rawDateStr: string): { isoDate: string; daysRemaining: number } {
  if (!rawDateStr) {
    const fallback = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { isoDate: fallback, daysRemaining: 60 };
  }

  try {
    const cleaned = rawDateStr.trim().replace('Z', '+00:00');
    const parsed = new Date(cleaned);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${rawDateStr}`);
    }

    const isoDate = parsed.toISOString().split('T')[0];
    const now = new Date();
    const diffMs = parsed.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return { isoDate, daysRemaining };
  } catch {
    const fallback = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { isoDate: fallback, daysRemaining: 60 };
  }
}

/**
 * Normalizes currency and calculates estimated USD purchasing power value.
 */
export function normalizeCurrency(rawCurrency: string, rawAmount: number): {
  currencyCode: string;
  totalAwardValue: string;
  estimatedUSDValue: number;
} {
  const code = (rawCurrency || 'USD').toUpperCase().trim();
  const rate = EXCHANGE_RATES_TO_USD[code] || 1.0;
  const estimatedUSD = Math.round((rawAmount || 0) * rate);

  let formattedValue = '';
  if (code === 'GBP') {
    formattedValue = `Full tuition + £${(rawAmount / 12 || 1347).toFixed(0)}/mo`;
  } else if (code === 'EUR') {
    formattedValue = `Full tuition waiver + €${(rawAmount / 12 || 934).toFixed(0)}/mo`;
  } else if (code === 'USD') {
    formattedValue = `Full tuition + $${(rawAmount / 12 || 2100).toFixed(0)}/mo`;
  } else {
    formattedValue = `${code} ${rawAmount.toLocaleString()}`;
  }

  return {
    currencyCode: code,
    totalAwardValue: formattedValue,
    estimatedUSDValue: estimatedUSD
  };
}

/**
 * Normalizes destination countries and flags.
 */
export function normalizeCountries(rawCountries: string[]): {
  destinationCountries: string[];
  destinationFlag: string;
} {
  if (!rawCountries || rawCountries.length === 0) {
    return { destinationCountries: ['Global'], destinationFlag: '🌐' };
  }

  const normalized = rawCountries.map(c => {
    const key = c.toLowerCase().trim();
    return CANONICAL_COUNTRIES[key]?.name || c.trim();
  });

  const unique = Array.from(new Set(normalized));
  const primaryKey = unique[0].toLowerCase();
  const flag = CANONICAL_COUNTRIES[primaryKey]?.flag || '🌐';

  return { destinationCountries: unique, destinationFlag: flag };
}

/**
 * Normalizes academic degree levels into standard DegreeLevel enum.
 */
export function normalizeStudyLevels(rawLevels: string[]): DegreeLevel[] {
  if (!rawLevels || rawLevels.length === 0) {
    return ['masters'];
  }

  const normalized: DegreeLevel[] = [];
  for (const lvl of rawLevels) {
    const l = lvl.toLowerCase();
    if (l.includes('master') || l.includes('msc') || l.includes('ma') || l.includes('mres') || l.includes('mpp')) {
      normalized.push('masters');
    } else if (l.includes('phd') || l.includes('doctor') || l.includes('dphil')) {
      normalized.push('phd');
    } else if (l.includes('bachelor') || l.includes('undergrad') || l.includes('bsc') || l.includes('ba')) {
      normalized.push('bachelors');
    } else if (l.includes('postdoc') || l.includes('fellowship')) {
      normalized.push('postdoc');
    } else if (l.includes('secondary') || l.includes('high school')) {
      normalized.push('secondary');
    }
  }

  return Array.from(new Set(normalized)).length > 0
    ? Array.from(new Set(normalized))
    : ['masters'];
}

/**
 * Normalizes raw eligibility clauses into typed EligibilityCriterion structures.
 */
export function normalizeCriteria(
  slug: string,
  clauses: RawApiScholarshipPayload['eligibility_clauses']
): EligibilityCriterion[] {
  return clauses.map((clause, idx) => {
    let ruleType: CriterionRuleType = 'citizenship';
    const rt = clause.rule_type.toLowerCase();
    if (rt.includes('citiz')) ruleType = 'citizenship';
    else if (rt.includes('deg')) ruleType = 'degree_level';
    else if (rt.includes('field') || rt.includes('subject')) ruleType = 'field_of_study';
    else if (rt.includes('score') || rt.includes('gpa') || rt.includes('grade')) ruleType = 'academic_score';
    else if (rt.includes('lang') || rt.includes('english')) ruleType = 'language';
    else if (rt.includes('work') || rt.includes('exp')) ruleType = 'work_experience';
    else if (rt.includes('dead')) ruleType = 'deadline';

    const params = clause.parameters || {};

    return {
      id: `${slug}-crit-${idx + 1}`,
      ruleType,
      title: clause.title,
      description: clause.description,
      isMandatory: clause.is_mandatory,
      sourceCitation: clause.source_citation,
      allowedCitizenships: params.allowed_countries,
      prohibitedCitizenships: params.prohibited_countries,
      minGpaNormalized: params.min_gpa_normalized,
      minWorkYears: params.min_work_years,
      requiresEnglishCert: params.min_ielts ? true : false
    };
  });
}
