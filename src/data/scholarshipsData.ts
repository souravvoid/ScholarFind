import { Scholarship } from '../types';

export const SCHOLARSHIPS_DATA: Scholarship[] = [
  {
    id: 'gates-cambridge',
    slug: 'gates-cambridge-scholarship',
    title: 'Gates Cambridge Scholarship',
    providerName: 'University of Cambridge',
    providerCategory: 'Official University Trust',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr9gJP6XM79yucTQ7z5hfYE3MZu-jKd48lS-QKTuIhWT7kJQwZNqaips5obn1sbiBqQM2mNgA3_o5MAhUm3_11e6VJmVEWsJwz8C1Ykq2OgnxEW5PPz5vupG8HF4DvzKFbdrNcW62hvgjh_hxRh5b1pRb1lmakPIdeLI0Xryj1Jv2AUuqzGPCd70aTtBp1h5ZTEGCXJoHHq6lEEcnqDsvKer1-3NYt_EexbcaUkd3_00qYqbPmbhcV',
    destinationCountries: ['United Kingdom'],
    destinationFlag: '🇬🇧',
    hostInstitutions: ['University of Cambridge'],
    studyLevels: ['masters', 'phd'],
    fieldsOfStudy: ['All fields available at Cambridge', 'STEM', 'Social Sciences', 'Humanities', 'Biomedical'],
    totalAwardValue: 'Full tuition + £20,000/yr',
    awardDetails: 'Includes airfare, visa fees & family allowance',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 68000,
    applicationDeadline: '2025-12-04',
    daysRemaining: 47,
    academicYear: '2025/2026',
    lastVerified: '3 days ago',
    officialSourceUrl: 'https://www.gatescambridge.org',
    officialApplicationUrl: 'https://www.postgraduate.study.cam.ac.uk/how-to-apply',
    sourceDomain: 'gatescambridge.org',
    overview: 'The Gates Cambridge Scholarship is one of the most prestigious international scholarships in the world. Established through a donation from the Bill and Melinda Gates Foundation, it covers the full cost of studying at Cambridge plus discretionary funding.',
    requiredDocuments: [
      'Official Academic Transcripts (Certified English translation)',
      'Gates Cambridge Statement (500 words on leadership & commitment to improving lives)',
      'Research Proposal (for PhD candidates)',
      'Two Academic References and one Personal Reference'
    ],
    applicationInstructions: [
      'Submit admission application to the University of Cambridge Graduate Admissions portal.',
      'Select the Gates Cambridge funding checkbox on the supplementary application form.',
      'Submit the required 500-word Gates statement and supporting references before your course deadline.'
    ],
    provenance: {
      sourceName: 'University of Cambridge Trust',
      sourceRecordUrl: 'https://www.gatescambridge.org/apply/eligibility/',
      collectedAt: '2026-10-15T10:00:00Z',
      sourceId: 'src_csc_uk'
    },
    criteria: [
      {
        id: 'gc_crit_cit',
        ruleType: 'citizenship',
        title: 'International Citizenship',
        description: 'Open to citizens of any country outside the United Kingdom.',
        isMandatory: true,
        sourceCitation: 'Gates Cambridge Trust Eligibility Guidelines, Clause 2.1',
        prohibitedCitizenships: ['United Kingdom']
      },
      {
        id: 'gc_crit_deg',
        ruleType: 'degree_level',
        title: 'Postgraduate Degree Level',
        description: 'Applying to pursue a full-time PhD, MSc/MLitt, or one-year postgraduate course.',
        isMandatory: true,
        sourceCitation: 'Cambridge Postgraduate Admissions Course Directory',
        requiredDegrees: ['masters', 'phd']
      },
      {
        id: 'gc_crit_gpa',
        ruleType: 'academic_score',
        title: 'Outstanding Intellectual Ability',
        description: 'Minimum equivalent of a UK First Class Honours degree (US GPA 3.75+ / 4.0 or 4.7+ / 5.0).',
        isMandatory: true,
        sourceCitation: 'University of Cambridge Academic Standards Regulations',
        minGpaNormalized: 85
      },
      {
        id: 'gc_crit_lang',
        ruleType: 'language',
        title: 'English Language Competence',
        description: 'IELTS Academic 7.5 (minimum 7.0 per band) or institutional medium-of-instruction waiver.',
        isMandatory: false,
        sourceCitation: 'Cambridge Language Assessment Centre Standards',
        requiresEnglishCert: true
      }
    ]
  },
  {
    id: 'daad-helmut-schmidt',
    slug: 'daad-helmut-schmidt-programme',
    title: 'DAAD Helmut-Schmidt Programme',
    providerName: 'Federal Foreign Office',
    providerCategory: 'Government Endowment',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd1Ps0HHfIcENPdEXwaeqy-h4OJ2Eckw_Q4RQNeGGeRz0EQwR1JP4QMB6IbY2dzbkmJ3tFd3dnuvXhX9PB9r6ZQrUBb5hCL0AD18WxSmteI1N1d8O0Rv8uQZu9cNST5O70z9E_difb-qyrYRM0-65wtLJYRWRj64ywOIzlhdttf352YPaN37xLgbCEOVHbqVz9BDCHch7n3xiRJFSlmaIcyVSO9E-XBs6bPlBUmdCTO3gTHoPt6xx6',
    destinationCountries: ['Germany'],
    destinationFlag: '🇩🇪',
    hostInstitutions: ['University of Passau', 'University of Erfurt', 'Osnabrück University', 'University of Duisburg-Essen'],
    studyLevels: ['masters'],
    fieldsOfStudy: ['Public Policy', 'Good Governance', 'Economics', 'International Relations', 'Political Science', 'Social Sciences'],
    totalAwardValue: 'Full funding + €934/mo',
    awardDetails: 'Includes health insurance & research grant',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 42000,
    applicationDeadline: '2025-11-30',
    daysRemaining: 43,
    academicYear: '2025/2026',
    lastVerified: '1 week ago',
    officialSourceUrl: 'https://www.daad.de',
    officialApplicationUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/',
    sourceDomain: 'daad.de',
    overview: 'The Helmut-Schmidt-Programme (known as Public Policy and Good Governance) supports future leaders from developing and emerging countries who strive for democracy and social justice.',
    requiredDocuments: [
      'DAAD Application Form',
      'Hand-signed Curriculum Vitae (Europass format)',
      'Letter of Motivation highlighting public policy relevance (max 2 pages)',
      'Certified University Degree Certificates & Grading Scale Breakdown',
      'Proof of English language proficiency'
    ],
    applicationInstructions: [
      'Select up to two master courses from the participating German university consortium.',
      'Submit your application packet directly to the selected universities during the open intake window.',
      'Include the standard DAAD Helmut-Schmidt nomination form in both submissions.'
    ],
    provenance: {
      sourceName: 'German Academic Exchange Service',
      sourceRecordUrl: 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/?detail=50026397',
      collectedAt: '2026-10-11T12:00:00Z',
      sourceId: 'src_daad_de'
    },
    criteria: [
      {
        id: 'daad_crit_cit',
        ruleType: 'citizenship',
        title: 'DAC List Developing/Emerging Country',
        description: 'Applicants must hold citizenship of a country on the OECD DAC list.',
        isMandatory: true,
        sourceCitation: 'Federal Foreign Office DAC List Specification',
        prohibitedCitizenships: ['Germany', 'United States', 'United Kingdom', 'France', 'Australia', 'Canada']
      },
      {
        id: 'daad_crit_deg',
        ruleType: 'degree_level',
        title: 'Completed Bachelor Degree',
        description: 'Hold a first university degree in social sciences, economics, law, or related discipline.',
        isMandatory: true,
        sourceCitation: 'DAAD Helmut-Schmidt Academic Prerequisite Catalog',
        requiredDegrees: ['masters']
      },
      {
        id: 'daad_crit_field',
        ruleType: 'field_of_study',
        title: 'Public Policy or Governance Discipline',
        description: 'Bachelor specialization in Political Science, Economics, Public Administration, Law, or Social Policy.',
        isMandatory: true,
        sourceCitation: 'DAAD Subject Area Taxonomy Rubric',
        applicableFields: ['Public Policy', 'Economics', 'Social Sciences', 'Law', 'International Relations', 'Governance']
      },
      {
        id: 'daad_crit_gpa',
        ruleType: 'academic_score',
        title: 'Above-Average Academic Record',
        description: 'Graduation results well above average (top third of class, minimum 75% equivalent).',
        isMandatory: true,
        sourceCitation: 'German University Equivalence Table (Anabin)',
        minGpaNormalized: 75
      }
    ]
  },
  {
    id: 'knight-hennessy',
    slug: 'knight-hennessy-scholars',
    title: 'Knight-Hennessy Scholars',
    providerName: 'Stanford University',
    providerCategory: 'Private Foundation',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9JeeVCqQjHTvkWRYflK7HLNYCIEzK28H7qHwM3DT24rnQe-xsy4BgZsVovuH3D1fTdbaieOstKvvbQO84wtRijs4aI_0m7MFJZ2YTzyTqHOYkV1JlydBR06zER_ORluJ46kZbH5of6Te-P4-pWO_9YdNPmVp61Q8L7eSlJ25BvwTSjpe7m9TjnOCV7R9KMgObXBrBvGyimU3mSepJrG0aX1DNn3mOXDKftx9fq-vOl20inBl444IS',
    destinationCountries: ['United States'],
    destinationFlag: '🇺🇸',
    hostInstitutions: ['Stanford University'],
    studyLevels: ['masters', 'phd'],
    fieldsOfStudy: ['All Graduate Fields', 'Computer Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Humanities'],
    totalAwardValue: 'Full tuition & stipend',
    awardDetails: 'Up to 3 years graduate support',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 92000,
    applicationDeadline: '2025-10-31',
    daysRemaining: 13,
    academicYear: '2025/2026',
    lastVerified: 'Yesterday',
    officialSourceUrl: 'https://knight-hennessy.stanford.edu',
    officialApplicationUrl: 'https://knight-hennessy.stanford.edu/admission/apply',
    sourceDomain: 'knight-hennessy.stanford.edu',
    overview: 'Knight-Hennessy Scholars cultivates and supports a multidisciplinary, multicultural community of graduate students across Stanford University, preparing them to address complex challenges.',
    requiredDocuments: [
      'Online Knight-Hennessy Application',
      'Unofficial Transcripts for all collegiate institutions attended',
      'Standardized Test Scores (GRE/GMAT if required by Stanford department)',
      'Two Recommendation Letters assessing character and leadership impact',
      'Short Video Statement & Leadership Essay'
    ],
    applicationInstructions: [
      'Submit the Knight-Hennessy Scholars application by early October deadline.',
      'Separately apply to your chosen Stanford graduate degree program by its departmental deadline.',
      'Complete the interactive video prompt after submission.'
    ],
    provenance: {
      sourceName: 'Knight-Hennessy Foundation at Stanford',
      sourceRecordUrl: 'https://knight-hennessy.stanford.edu/admission/eligibility',
      collectedAt: '2026-10-17T09:00:00Z',
      sourceId: 'src_fulbright_us'
    },
    criteria: [
      {
        id: 'kh_crit_cit',
        ruleType: 'citizenship',
        title: 'Global Eligibility',
        description: 'Open to citizens of all countries without geographic restriction.',
        isMandatory: true,
        sourceCitation: 'Knight-Hennessy Global Charter Section 1',
        allowedCitizenships: ['*']
      },
      {
        id: 'kh_crit_deg',
        ruleType: 'degree_level',
        title: 'Stanford Graduate Degree Candidacy',
        description: 'Must apply to enroll in a full-time Stanford graduate program (MA, MS, PhD, JD, MD, MBA).',
        isMandatory: true,
        sourceCitation: 'Stanford Graduate Degree Matriculation Requirements',
        requiredDegrees: ['masters', 'phd']
      },
      {
        id: 'kh_crit_grad',
        ruleType: 'deadline',
        title: 'Recent Bachelor Graduation Window',
        description: 'Earned first undergraduate degree within the past 7 years.',
        isMandatory: true,
        sourceCitation: 'Eligibility Cycle Guidelines 2025'
      },
      {
        id: 'kh_crit_gpa',
        ruleType: 'academic_score',
        title: 'High Scholastic Achievement',
        description: 'Competitive academic standing (US 3.8+ GPA or equivalent first-class transcript).',
        isMandatory: true,
        sourceCitation: 'Stanford Academic Council Admissions Benchmarks',
        minGpaNormalized: 88
      }
    ]
  },
  {
    id: 'commonwealth-masters',
    slug: 'commonwealth-masters-scholarship',
    title: 'Commonwealth Master’s Scholarship 2025/26',
    providerName: 'Commonwealth Scholarship Commission / FCDO (UK)',
    providerCategory: 'Government Endowment',
    heroImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['United Kingdom'],
    destinationFlag: '🇬🇧',
    hostInstitutions: ['UK Participating Higher Education Institutions'],
    studyLevels: ['masters'],
    fieldsOfStudy: ['Science and Technology for Development', 'Strengthening Health Systems', 'Global Prosperity', 'Peace & Governance', 'Resilience & Crises'],
    totalAwardValue: 'Full tuition + £1,347/mo + return flight',
    awardDetails: 'Includes airfare, thesis grant & warm clothing allowance',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 54000,
    applicationDeadline: '2025-12-12',
    daysRemaining: 48,
    academicYear: '2025/2026',
    lastVerified: 'Oct 24, 2025',
    officialSourceUrl: 'https://www.gov.uk/government/organisations/commonwealth-scholarship-commission-in-the-uk',
    officialApplicationUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
    sourceDomain: 'gov.uk',
    overview: 'Funded by the UK Foreign, Commonwealth & Development Office (FCDO), Commonwealth Master’s Scholarships enable talented and motivated individuals to gain the knowledge and skills required for sustainable development.',
    requiredDocuments: [
      'Proof of citizenship or refugee status in an eligible Commonwealth country',
      'Full academic transcripts including graduation certificates',
      'Two references submitted directly to the online application system',
      'Development Impact Statement (explaining connection to UN SDGs)'
    ],
    applicationInstructions: [
      'Check whether your home country requires an application via a National Nominating Agency or direct submission.',
      'Submit your application via the CSC online application system before December deadline.',
      'Apply separately for admission to at least one eligible UK university course.'
    ],
    provenance: {
      sourceName: 'Commonwealth Scholarship Commission',
      sourceRecordUrl: 'https://cscuk.fcdo.gov.uk/about-us/',
      collectedAt: '2026-10-18T08:30:00Z',
      sourceId: 'src_csc_uk'
    },
    criteria: [
      {
        id: 'cws_crit_cit',
        ruleType: 'citizenship',
        title: 'Eligible Commonwealth Citizenship',
        description: 'Citizen of an eligible Commonwealth developing country (e.g., Nigeria, Ghana, Kenya, India, Pakistan, Bangladesh, South Africa, etc.).',
        isMandatory: true,
        sourceCitation: 'CSC Regulations Schedule 1',
        allowedCitizenships: ['Nigeria', 'Ghana', 'Kenya', 'India', 'Pakistan', 'Bangladesh', 'South Africa', 'Uganda', 'Tanzania', 'Rwanda', 'Jamaica', 'Sri Lanka', 'Malaysia']
      },
      {
        id: 'cws_crit_deg',
        ruleType: 'academic_score',
        title: 'Undergraduate Degree Standard',
        description: 'Hold a first degree of at least upper second class (2:1) honours standard (or GPA equivalent).',
        isMandatory: true,
        sourceCitation: 'UK-ENIC Credential Standard Requirement',
        minGpaNormalized: 75
      },
      {
        id: 'cws_crit_lev',
        ruleType: 'degree_level',
        title: 'Master’s Degree Candidate',
        description: 'Unable to afford to study in the UK without this scholarship.',
        isMandatory: true,
        sourceCitation: 'CSC FCDO Means-Tested Public Charter',
        requiredDegrees: ['masters']
      },
      {
        id: 'cws_crit_lang',
        ruleType: 'language',
        title: 'English Language Competence',
        description: 'Hold an academic English certificate or institutional confirmation of English medium instruction.',
        isMandatory: false,
        sourceCitation: 'UK Home Office Student Visa Tier 4 Regulations',
        requiresEnglishCert: true
      }
    ]
  },
  {
    id: 'erasmus-mundus-data',
    slug: 'erasmus-mundus-joint-master-data-intelligence',
    title: 'Erasmus Mundus Joint Master Degree in Data Intelligence',
    providerName: 'European Commission Education & Culture Executive Agency',
    providerCategory: 'Multilateral Agency',
    heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['France', 'Italy', 'Finland'],
    destinationFlag: '🇪🇺',
    hostInstitutions: ['Université Paris-Saclay', 'Politecnico di Milano', 'Aalto University'],
    studyLevels: ['masters'],
    fieldsOfStudy: ['Computer Science', 'Data Science & Artificial Intelligence (STEM)', 'Machine Learning', 'Mathematics', 'Software Engineering'],
    totalAwardValue: '€1,400/mo stipend + full tuition waiver + travel',
    awardDetails: 'Includes comprehensive worldwide health & accident insurance',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 49000,
    applicationDeadline: '2026-01-15',
    daysRemaining: 82,
    academicYear: '2026/2027',
    lastVerified: '4 days ago',
    officialSourceUrl: 'https://www.eacea.ec.europa.eu',
    officialApplicationUrl: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en',
    sourceDomain: 'europa.eu',
    overview: 'Erasmus Mundus Joint Masters are high-level integrated study programmes designed and delivered by an international partnership of higher education institutions, fully funded by the European Union.',
    requiredDocuments: [
      'BSc Degree Certificate and detailed transcript of records',
      'Curriculum Vitae (Europass model recommended)',
      'Statement of Purpose and Research Motivation',
      'Two Letters of Academic Recommendation',
      'Proof of nationality and residence certificate'
    ],
    applicationInstructions: [
      'Consult the official Erasmus Mundus catalogue to select the Data Intelligence consortium.',
      'Submit the joint application directly via the coordinator university portal (Paris-Saclay).',
      'Select the EMJM Scholarship consideration option during registration.'
    ],
    provenance: {
      sourceName: 'European Education and Culture Executive Agency (EACEA)',
      sourceRecordUrl: 'https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters',
      collectedAt: '2026-10-16T12:00:00Z',
      sourceId: 'src_erasmus_eu'
    },
    criteria: [
      {
        id: 'em_crit_cit',
        ruleType: 'citizenship',
        title: 'Partner Country or Programme Country Citizen',
        description: 'Open to students worldwide. Partner country applicants receive prioritized living allowances.',
        isMandatory: true,
        sourceCitation: 'Erasmus+ Programme Guide 2025/2026',
        allowedCitizenships: ['*']
      },
      {
        id: 'em_crit_field',
        ruleType: 'field_of_study',
        title: 'STEM / Computing Academic Foundation',
        description: 'First degree in Computer Science, Data Science, Electrical Engineering, Mathematics, or AI.',
        isMandatory: true,
        sourceCitation: 'Consortium Academic Prerequisites Matrix',
        applicableFields: ['Computer Science', 'Data Science', 'Machine Learning', 'STEM', 'Mathematics']
      },
      {
        id: 'em_crit_gpa',
        ruleType: 'academic_score',
        title: 'High Academic Standing',
        description: 'Proven high academic performance (minimum 80% equivalent / ECTS grade B or higher).',
        isMandatory: true,
        sourceCitation: 'European Credit Transfer System (ECTS) Protocol',
        minGpaNormalized: 78
      }
    ]
  },
  {
    id: 'rotary-peace-fellowship',
    slug: 'rotary-peace-fellowship',
    title: 'Rotary Peace Fellowship',
    providerName: 'The Rotary Foundation',
    providerCategory: 'Private Foundation',
    heroImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['United Kingdom', 'Japan', 'Australia', 'Sweden', 'United States'],
    destinationFlag: '🌐',
    hostInstitutions: ['University of Bradford', 'International Christian University', 'University of Queensland', 'Uppsala University', 'Duke University'],
    studyLevels: ['masters'],
    fieldsOfStudy: ['Peace & Conflict Resolution', 'International Development', 'Human Rights', 'Public Policy', 'Global Health'],
    totalAwardValue: 'Fully funded: tuition, room, board & field study',
    awardDetails: 'Covers round-trip transportation, all internship and field-study expenses',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 75000,
    applicationDeadline: '2026-05-15',
    daysRemaining: 202,
    academicYear: '2026/2027',
    lastVerified: 'Oct 18, 2025',
    officialSourceUrl: 'https://www.rotary.org',
    officialApplicationUrl: 'https://www.rotary.org/en/our-programs/peace-fellowships',
    sourceDomain: 'rotary.org',
    overview: 'Each year, The Rotary Foundation awards up to 130 fully funded fellowships for dedicated leaders from around the world to study at one of Rotary Peace Centers.',
    requiredDocuments: [
      'Resume / CV documenting relevant peacebuilding or community leadership',
      'Essays detailing commitment to peace and international understanding',
      'Two professional letters of recommendation',
      'Transcripts from all post-secondary institutions attended'
    ],
    applicationInstructions: [
      'Complete the online fellowship application through the Rotary Foundation Portal.',
      'Connect with a local Rotary district for endorsement before May 15.',
      'Submit the completed dossier with district endorsement by the universal cutoff.'
    ],
    provenance: {
      sourceName: 'The Rotary Foundation Trustees',
      sourceRecordUrl: 'https://www.rotary.org/en/peace-fellowships-application',
      collectedAt: '2026-10-18T02:00:00Z',
      sourceId: 'src_rotary_global'
    },
    criteria: [
      {
        id: 'rot_crit_exp',
        ruleType: 'work_experience',
        title: '3+ Years Peace or Community Development Experience',
        description: 'Demonstrated minimum 3 years of full-time professional experience in peacebuilding, human rights, or community development.',
        isMandatory: true,
        sourceCitation: 'Rotary Peace Centers Selection Criteria Section 2',
        minWorkYears: 3
      },
      {
        id: 'rot_crit_cit',
        ruleType: 'citizenship',
        title: 'Worldwide Applicant Eligibility',
        description: 'Open to nationals of all countries. Note: active Rotarians and immediate family are ineligible.',
        isMandatory: true,
        sourceCitation: 'Rotary Conflict of Interest Policy 2025',
        allowedCitizenships: ['*']
      },
      {
        id: 'rot_crit_deg',
        ruleType: 'degree_level',
        title: 'Bachelor’s Degree Prerequisite',
        description: 'Undergraduate degree completed before commencement of fellowship.',
        isMandatory: true,
        sourceCitation: 'Host University Graduate Matriculation Requirements',
        requiredDegrees: ['masters']
      }
    ]
  },
  {
    id: 'fulbright-foreign-student',
    slug: 'fulbright-foreign-student-program',
    title: 'Fulbright Foreign Student Program',
    providerName: 'U.S. Department of State / IIE',
    providerCategory: 'Government Endowment',
    heroImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['United States'],
    destinationFlag: '🇺🇸',
    hostInstitutions: ['Accredited US Universities'],
    studyLevels: ['masters', 'phd'],
    fieldsOfStudy: ['All fields excluding clinical medical patient contact'],
    totalAwardValue: 'Full tuition, monthly stipend, health & flights',
    awardDetails: 'Includes J-1 visa sponsorship, book allowance, and enrichment seminars',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel', 'health'],
    estimatedUSDValue: 72000,
    applicationDeadline: '2026-06-01',
    daysRemaining: 219,
    academicYear: '2026/2027',
    lastVerified: 'Oct 20, 2025',
    officialSourceUrl: 'https://foreign.fulbrightonline.org',
    officialApplicationUrl: 'https://foreign.fulbrightonline.org/about/foreign-student-program',
    sourceDomain: 'foreign.fulbrightonline.org',
    overview: 'The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to research and study in the United States for one year or longer.',
    requiredDocuments: [
      'Official academic records and degree certificates',
      'Study / Research Objective statement (elaborating on academic goals in the US)',
      'Personal Statement (narrative on personal background and cross-cultural adaptability)',
      'Three confidential letters of recommendation'
    ],
    applicationInstructions: [
      'Application details and deadlines vary significantly by country.',
      'Check the bilateral commission or US Embassy website in your home country.',
      'Submit the online Fulbright portal application designated for your national citizenship.'
    ],
    provenance: {
      sourceName: 'Bureau of Educational and Cultural Affairs',
      sourceRecordUrl: 'https://eca.state.gov/fulbright/fulbright-programs/program-details/foreign-fulbright-student-program',
      collectedAt: '2026-10-18T06:00:00Z',
      sourceId: 'src_fulbright_us'
    },
    criteria: [
      {
        id: 'ful_crit_cit',
        ruleType: 'citizenship',
        title: 'Participating Country Citizen',
        description: 'Must be a citizen of a participating country with a valid international passport.',
        isMandatory: true,
        sourceCitation: 'Fulbright Act (Public Law 87-256)',
        prohibitedCitizenships: ['United States']
      },
      {
        id: 'ful_crit_deg',
        ruleType: 'academic_score',
        title: 'Undergraduate Academic Credentials',
        description: 'First university degree completed with a competitive cumulative GPA (equivalent to US 3.5+ / 4.0).',
        isMandatory: true,
        sourceCitation: 'IIE Foreign Student Placement Manual',
        minGpaNormalized: 78
      },
      {
        id: 'ful_crit_lang',
        ruleType: 'language',
        title: 'English Language Competence (TOEFL / IELTS)',
        description: 'Demonstrated English proficiency required for US graduate school admission.',
        isMandatory: true,
        sourceCitation: 'ECA English Language Protocol',
        requiresEnglishCert: true
      }
    ]
  },
  {
    id: 'chevening-scholarship',
    slug: 'chevening-scholarship-uk',
    title: 'Chevening Scholarships UK',
    providerName: 'UK Foreign, Commonwealth & Development Office',
    providerCategory: 'Government Endowment',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['United Kingdom'],
    destinationFlag: '🇬🇧',
    hostInstitutions: ['Any accredited UK University'],
    studyLevels: ['masters'],
    fieldsOfStudy: ['All eligible one-year taught Master’s courses'],
    totalAwardValue: 'Full tuition + monthly living allowance + airfare',
    awardDetails: 'Includes visa application fee, arrival allowance & travel to Chevening events',
    coverageTypes: ['full_ride', 'full_tuition', 'stipend', 'travel'],
    estimatedUSDValue: 52000,
    applicationDeadline: '2025-11-05',
    daysRemaining: 18,
    academicYear: '2025/2026',
    lastVerified: '5 days ago',
    officialSourceUrl: 'https://www.chevening.org',
    officialApplicationUrl: 'https://www.chevening.org/scholarships/guidance/',
    sourceDomain: 'chevening.org',
    overview: 'Chevening is the UK government’s international awards programme. Funded by the Foreign, Commonwealth and Development Office and partner organisations, we offer fully-funded master’s scholarships for emerging leaders.',
    requiredDocuments: [
      'Two academic/professional reference letters in English',
      'Valid passport / national identity document',
      'Official undergraduate degree certificate and transcript',
      'Three unconditional UK university course offers by July of the application year'
    ],
    applicationInstructions: [
      'Select three eligible UK master’s degree programmes.',
      'Write four mandatory Chevening essays (Leadership & Influence, Networking, Studying in the UK, Career Plan).',
      'Submit the completed dossier through the Chevening online application portal before deadline.'
    ],
    provenance: {
      sourceName: 'Chevening Secretariat',
      sourceRecordUrl: 'https://www.chevening.org/scholarships/who-can-apply/eligibility/',
      collectedAt: '2026-10-18T09:45:00Z',
      sourceId: 'src_chevening_uk'
    },
    criteria: [
      {
        id: 'chv_crit_cit',
        ruleType: 'citizenship',
        title: 'Chevening-eligible Country Citizen',
        description: 'Citizen of a Chevening-eligible country or territory and commitment to return for minimum 2 years.',
        isMandatory: true,
        sourceCitation: 'Chevening Programme Charter 2025',
        prohibitedCitizenships: ['United Kingdom', 'United States']
      },
      {
        id: 'chv_crit_exp',
        ruleType: 'work_experience',
        title: 'Two Years Work Experience (2,800 Hours)',
        description: 'Minimum two years of documented work experience (equivalent to 2,800 hours).',
        isMandatory: true,
        sourceCitation: 'Chevening Work Experience Calculation Rules',
        minWorkYears: 2
      },
      {
        id: 'chv_crit_deg',
        ruleType: 'academic_score',
        title: 'Upper Second-Class 2:1 Honours Equivalent',
        description: 'Hold an undergraduate degree equivalent to an upper second-class 2:1 honours degree in the UK.',
        isMandatory: true,
        sourceCitation: 'UK-ENIC Credential Framework',
        minGpaNormalized: 75
      }
    ]
  },
  {
    id: 'vanier-cgs',
    slug: 'vanier-canada-graduate-scholarship',
    title: 'Vanier Canada Graduate Scholarships (Vanier CGS)',
    providerName: 'Government of Canada / CIHR / NSERC / SSHRC',
    providerCategory: 'Government Endowment',
    heroImage: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1200&q=80',
    destinationCountries: ['Canada'],
    destinationFlag: '🇨🇦',
    hostInstitutions: ['Canadian Universities with Vanier CGS Quota'],
    studyLevels: ['phd'],
    fieldsOfStudy: ['Health Research (CIHR)', 'Natural Sciences & Engineering (NSERC)', 'Social Sciences & Humanities (SSHRC)'],
    totalAwardValue: '$50,000 CAD/year for 3 years',
    awardDetails: 'Tax-exempt non-renewable doctoral stipend ($150,000 CAD total)',
    coverageTypes: ['stipend', 'full_tuition'],
    estimatedUSDValue: 110000,
    applicationDeadline: '2025-11-01',
    daysRemaining: 14,
    academicYear: '2025/2026',
    lastVerified: 'Oct 17, 2025',
    officialSourceUrl: 'https://vanier.gc.ca',
    officialApplicationUrl: 'https://vanier.gc.ca/en/nomination_process-processus_de_mise_en_candidature.html',
    sourceDomain: 'vanier.gc.ca',
    overview: 'The Vanier Canada Graduate Scholarships (Vanier CGS) program helps Canadian institutions attract highly qualified doctoral students. It values Academic Excellence, Research Potential, and Leadership.',
    requiredDocuments: [
      'ResearchNet online application form and CCV (Canadian Common CV)',
      'Detailed Doctoral Research Proposal (max 2 pages)',
      'Leadership Reference Letter and Academic Reference Assessments',
      'All official post-secondary transcripts certified by nominating institution'
    ],
    applicationInstructions: [
      'Candidates must be nominated by the Canadian institution at which they want to study.',
      'Check internal institutional deadlines (which are earlier than the national November deadline).',
      'Prepare application through ResearchNet and verify quota status with the university graduate studies office.'
    ],
    provenance: {
      sourceName: 'Vanier-Banting Secretariat',
      sourceRecordUrl: 'https://vanier.gc.ca/en/eligibility-admissibilite.html',
      collectedAt: '2026-10-17T19:00:00Z',
      sourceId: 'src_vanier_ca'
    },
    criteria: [
      {
        id: 'van_crit_deg',
        ruleType: 'degree_level',
        title: 'Doctoral / PhD Pursuit',
        description: 'Nominated for a full-time doctoral program in a Canadian university with allocation.',
        isMandatory: true,
        sourceCitation: 'Vanier CGS Federal Mandate Section 3',
        requiredDegrees: ['phd']
      },
      {
        id: 'van_crit_gpa',
        ruleType: 'academic_score',
        title: 'First-Class Academic Standing (First Class / A-)',
        description: 'First-class average in each of the last two years of full-time study.',
        isMandatory: true,
        sourceCitation: 'Tri-Agency Harmonized Credential Standard',
        minGpaNormalized: 85
      },
      {
        id: 'van_crit_cit',
        ruleType: 'citizenship',
        title: 'Open to Canadian & International Citizens',
        description: 'Canadian citizens, permanent residents of Canada, and international students are eligible.',
        isMandatory: true,
        sourceCitation: 'Vanier CGS International Inclusion Clause',
        allowedCitizenships: ['*']
      }
    ]
  }
];
