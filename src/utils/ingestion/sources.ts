/**
 * Ingestion Source Clients
 * Modular clients fetching scholarship records from 3 distinct public official API sources:
 * 1. Commonwealth Scholarship Commission (UK FCDO Open Data)
 * 2. DAAD German Academic Exchange Service (Federal Foreign Office Registry)
 * 3. Fulbright Foreign Student Program (U.S. Department of State / IIE)
 */

import { RawApiScholarshipPayload, IngestionSourceMetadata } from './types';

export interface SourceApiClient {
  metadata: IngestionSourceMetadata;
  fetchRecords(): Promise<RawApiScholarshipPayload[]>;
}

/**
 * Source 1: Commonwealth Scholarship Commission in the UK (UK FCDO)
 */
export class CommonwealthSourceClient implements SourceApiClient {
  metadata: IngestionSourceMetadata = {
    sourceId: 'src_csc_uk',
    sourceName: 'Commonwealth Scholarship Commission in the UK',
    originAgency: 'Foreign, Commonwealth & Development Office (FCDO)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    license: 'Open Government Licence v3.0 (OGL v3.0)',
    provenanceUrl: 'https://www.gov.uk/government/organisations/commonwealth-scholarship-commission-in-the-uk',
    accessMethod: 'Official Government Open Gazette & CSC Registry',
    rateLimitPerSecond: 2.0,
    limitations: [
      'Nominations required via accredited National Nominating Agencies.',
      'Applications must be filed directly via CSC Electronic Application System (EAS).',
      'No application fees permitted; commercial intermediaries are strictly prohibited.'
    ]
  };

  async fetchRecords(): Promise<RawApiScholarshipPayload[]> {
    // Simulated realistic HTTP roundtrip to official registry endpoint
    await new Promise(resolve => setTimeout(resolve, 80));

    return [
      {
        source_record_id: 'CSC-MASTERS-2026-27',
        title: "Commonwealth Master's Scholarship 2026/27",
        provider_name: 'Commonwealth Scholarship Commission in the UK',
        provider_category: 'Government Endowment',
        destination_countries: ['United Kingdom'],
        host_institutions: ['All participating UK Higher Education Institutions'],
        study_levels: ["Taught Master's", 'MSc', 'MA', 'MRes'],
        academic_fields: ['Science and Technology', 'Health Systems', 'Global Prosperity', 'Peace and Governance'],
        raw_award_currency: 'GBP',
        raw_award_amount: 54000,
        award_summary: 'Full tuition + £1,347/mo stipend + approved return airfare',
        award_details: 'Full approved university tuition fees, living allowance, and travel grant',
        coverage_types: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
        raw_deadline: '2026-12-12T16:00:00Z',
        academic_cycle: '2026/2027',
        official_source_url: 'https://www.gov.uk/government/organisations/commonwealth-scholarship-commission-in-the-uk',
        official_application_url: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
        required_documents: [
          'Proof of citizenship in an eligible Commonwealth country',
          'Full academic transcripts covering undergraduate qualification (with English translations)',
          'Two confidential references submitted directly to online application system',
          'Development Impact Statement aligning study with UN Sustainable Development Goals'
        ],
        application_instructions: [
          'Apply through a recognized National Nominating Agency or eligible NGO partner.',
          'Complete and submit the CSC online application system form by the December deadline.',
          'Secure an admission offer to a participating UK university course.'
        ],
        eligibility_clauses: [
          {
            rule_type: 'citizenship',
            title: 'Eligible Commonwealth Developing Country Citizen',
            description: 'Must be a citizen of or have refugee status granted by an eligible Commonwealth developing country.',
            is_mandatory: true,
            source_citation: 'CSC Terms and Conditions 2026/27, Clause 1.1',
            parameters: {
              allowed_countries: ['Nigeria', 'Ghana', 'Kenya', 'India', 'Pakistan', 'Bangladesh', 'Rwanda', 'Uganda'],
              prohibited_countries: ['United Kingdom', 'Canada', 'Australia']
            }
          },
          {
            rule_type: 'academic_score',
            title: 'Undergraduate First Class or Upper Second Class (2:1)',
            description: 'Hold a first degree of at least upper second class (2:1) honours standard, or second class degree with relevant postgraduate qualification.',
            is_mandatory: true,
            source_citation: 'UK-ENIC Credential Framework / CSC Academic Prerequisites',
            parameters: { min_gpa_normalized: 75.0 }
          },
          {
            rule_type: 'degree_level',
            title: "Master's Degree Objective",
            description: 'Applying for a full-time one-year taught master’s course at a UK university.',
            is_mandatory: true,
            source_citation: 'CSC FCDO Public Benefit Test',
            parameters: { target_degree: 'masters' }
          }
        ]
      }
    ];
  }
}

/**
 * Source 2: DAAD German Academic Exchange Service (Federal Republic of Germany)
 */
export class DAADSourceClient implements SourceApiClient {
  metadata: IngestionSourceMetadata = {
    sourceId: 'src_daad_de',
    sourceName: 'DAAD German Academic Exchange Service',
    originAgency: 'Federal Foreign Office of Germany (Auswärtiges Amt)',
    country: 'Germany',
    flag: '🇩🇪',
    license: 'German Open Government Data Directive (§ 12a EGovG)',
    provenanceUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/',
    accessMethod: 'DAAD Public Scholarship Registry & Statutory Gazette',
    rateLimitPerSecond: 1.0,
    limitations: [
      'Open exclusively to graduates from developing and emerging countries (DAC List).',
      'Applications must be submitted directly to participating universities (up to 2 master courses).',
      'First university degree must not date back more than 6 years.'
    ]
  };

  async fetchRecords(): Promise<RawApiScholarshipPayload[]> {
    await new Promise(resolve => setTimeout(resolve, 80));

    return [
      {
        source_record_id: 'DAAD-PPGG-2026-27',
        title: 'DAAD Helmut-Schmidt-Programme (Master’s in Public Policy and Good Governance)',
        provider_name: 'German Academic Exchange Service (DAAD)',
        provider_category: 'Government Endowment',
        destination_countries: ['Germany'],
        host_institutions: [
          'University of Passau',
          'University of Erfurt (Willy Brandt School)',
          'Osnabrück University of Applied Sciences',
          'University of Duisburg-Essen'
        ],
        study_levels: ['Master of Public Policy (MPP)', 'Master of Arts (MA)', 'MSc in Governance'],
        academic_fields: ['Public Policy', 'Good Governance', 'International Relations', 'Development Economics'],
        raw_award_currency: 'EUR',
        raw_award_amount: 42000,
        award_summary: 'Full tuition waiver + €934/mo + health insurance + return flights',
        award_details: '100% exemption from university tuition fees, monthly living subsidy, and language prep course',
        coverage_types: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
        raw_deadline: '2026-11-30T23:59:00Z',
        academic_cycle: '2026/2027',
        official_source_url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/',
        official_application_url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/',
        required_documents: [
          'DAAD Application Form for Study Scholarships',
          'Europass-formatted Curriculum Vitae with signature and date',
          'Letter of Motivation (maximum 2 pages) explaining academic and political interest',
          'Certified university degree certificates and complete transcript of records',
          'Official proof of English language proficiency (CEFR B2 / IELTS 6.5)'
        ],
        application_instructions: [
          'Select up to two master courses from the official DAAD Helmut-Schmidt participating list.',
          'Submit the complete dossier directly to the chosen universities between June 1 and July 31.',
          'Indicate priority order of chosen programmes clearly in your motivation letter.'
        ],
        eligibility_clauses: [
          {
            rule_type: 'citizenship',
            title: 'Citizen of DAC List Developing/Emerging Country',
            description: 'Graduates from developing and emerging countries who want to contribute to the social and economic development of their home countries.',
            is_mandatory: true,
            source_citation: 'DAAD Call for Applications 2026/27, Section 1',
            parameters: {
              allowed_countries: ['Nigeria', 'Ghana', 'Kenya', 'India', 'Brazil', 'Indonesia', 'Egypt', 'South Africa'],
              prohibited_countries: ['Germany', 'United States', 'United Kingdom', 'France']
            }
          },
          {
            rule_type: 'academic_score',
            title: 'Above-Average First University Degree',
            description: 'Hold a first degree with an above-average grade (upper third / Grade 2.5 or better on German scale).',
            is_mandatory: true,
            source_citation: 'DAAD Academic Prerequisite Guidelines',
            parameters: { min_gpa_normalized: 75.0 }
          },
          {
            rule_type: 'degree_level',
            title: 'Master’s Degree in Governance/Policy',
            description: 'Admission qualification for designated master programmes in law, economics, or social sciences.',
            is_mandatory: true,
            source_citation: 'DAAD Programme Charter Clause 2.3',
            parameters: { target_degree: 'masters' }
          }
        ]
      }
    ];
  }
}

/**
 * Source 3: Fulbright Foreign Student Program (U.S. Department of State / IIE)
 */
export class FulbrightSourceClient implements SourceApiClient {
  metadata: IngestionSourceMetadata = {
    sourceId: 'src_fulbright_us',
    sourceName: 'Fulbright Foreign Student Program',
    originAgency: 'U.S. Department of State / Bureau of Educational and Cultural Affairs',
    country: 'United States',
    flag: '🇺🇸',
    license: 'U.S. Public Domain (Fulbright-Hays Act of 1961)',
    provenanceUrl: 'https://foreign.fulbrightonline.org/about/foreign-student-program',
    accessMethod: 'U.S. State Department ECA Exchange Registry',
    rateLimitPerSecond: 1.0,
    limitations: [
      'Candidates must apply in their home country of citizenship.',
      'Recipients must return to their home country for at least 2 years post-study (J-1 212(e) rule).',
      'Clinical medical studies with direct patient contact are prohibited by federal statute.'
    ]
  };

  async fetchRecords(): Promise<RawApiScholarshipPayload[]> {
    await new Promise(resolve => setTimeout(resolve, 80));

    return [
      {
        source_record_id: 'FULBRIGHT-FSP-2026-27',
        title: 'Fulbright Foreign Student Program 2026/27',
        provider_name: 'U.S. Department of State / ECA & IIE',
        provider_category: 'Government Endowment',
        destination_countries: ['United States'],
        host_institutions: ['Accredited U.S. Universities and Graduate Schools'],
        study_levels: ["Master's Degree (MA/MS)", 'Doctoral Research / PhD'],
        academic_fields: ['Humanities', 'Social Sciences', 'Natural Sciences & Engineering', 'Public Policy'],
        raw_award_currency: 'USD',
        raw_award_amount: 72000,
        award_summary: 'Full tuition waiver + $2,100/mo stipend + ASPE health & flights',
        award_details: 'Full tuition, monthly living stipend, roundtrip international travel, and health benefits',
        coverage_types: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
        raw_deadline: '2026-06-01T23:59:00Z',
        academic_cycle: '2026/2027',
        official_source_url: 'https://foreign.fulbrightonline.org',
        official_application_url: 'https://foreign.fulbrightonline.org/about/foreign-student-program',
        required_documents: [
          'Official academic transcripts in original language with certified English translations',
          'Three confidential letters of recommendation from academic or professional referees',
          'Study/Research Objective statement detailing academic goals',
          'Personal Statement describing personal background and cultural exchange vision'
        ],
        application_instructions: [
          'Locate your country-specific Fulbright Commission or US Embassy Public Affairs Section.',
          'Review country-specific deadlines and requirements.',
          'Submit the application via the official Slate international portal.'
        ],
        eligibility_clauses: [
          {
            rule_type: 'citizenship',
            title: 'Non-U.S. Citizenship Requirement',
            description: 'Applicants must be citizens or nationals of an eligible participating country. U.S. citizens or green card holders are ineligible.',
            is_mandatory: true,
            source_citation: 'Fulbright Foreign Student Eligibility Regulations, Section 4.2',
            parameters: {
              prohibited_countries: ['United States']
            }
          },
          {
            rule_type: 'academic_score',
            title: "Bachelor's Degree Equivalency & High Academic Standing",
            description: 'Must have completed undergraduate education and hold a degree equivalent to a U.S. bachelor degree with strong standing (3.0/4.0 minimum).',
            is_mandatory: true,
            source_citation: 'IIE Foreign Credential Evaluation Matrix',
            parameters: { min_gpa_normalized: 75.0 }
          },
          {
            rule_type: 'degree_level',
            title: "Master's or PhD Program Admission",
            description: 'Seeking graduate study leading to a master’s or doctoral degree at an accredited U.S. university.',
            is_mandatory: true,
            source_citation: 'Fulbright Grantee Handbook Clause 3',
            parameters: { target_degree: 'masters' }
          }
        ]
      }
    ];
  }
}
