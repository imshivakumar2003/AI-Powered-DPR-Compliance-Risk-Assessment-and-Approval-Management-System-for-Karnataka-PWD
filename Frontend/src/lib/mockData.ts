// TOPLINE

export interface DprItem {
  id: string;
  title: string;
  state: string;
  sector: string;
  cost: string;
  status: 'Approved' | 'Review' | 'Pending' | 'Rejected';
  riskLevel: 'Low' | 'Medium' | 'High';
  qualityScore: number;
  submittedDate: string;
  submittedBy: string;
}

export const mockDprs: DprItem[] = [
  {
    id: 'DPR-2025-0842',
    title: 'NH-217 Four-Lane Highway Extension',
    state: 'Karnataka',
    sector: 'Roads',
    cost: '₹ 842 Cr',
    status: 'Pending',
    riskLevel: 'High',
    qualityScore: 58,
    submittedDate: '21 Apr 2026',
    submittedBy: 'Belagavi PWD Office',
  },
  {
    id: 'DPR-2025-0841',
    title: 'Bengaluru Logistics Park & Ring Road',
    state: 'Karnataka',
    sector: 'Infrastructure',
    cost: '₹ 320 Cr',
    status: 'Review',
    riskLevel: 'Medium',
    qualityScore: 74,
    submittedDate: '20 Apr 2026',
    submittedBy: 'Karnataka PWD HQ',
  },
  {
    id: 'DPR-2025-0840',
    title: 'Kalaburagi Solar & Power Grid Phase 2',
    state: 'Karnataka',
    sector: 'Power',
    cost: '₹ 560 Cr',
    status: 'Approved',
    riskLevel: 'Low',
    qualityScore: 88,
    submittedDate: '19 Apr 2026',
    submittedBy: 'KPTCL Karnataka',
  },
  {
    id: 'DPR-2025-0839',
    title: 'Mysuru Smart Infrastructure Phase 2',
    state: 'Karnataka',
    sector: 'Urban',
    cost: '₹ 218 Cr',
    status: 'Approved',
    riskLevel: 'Low',
    qualityScore: 91,
    submittedDate: '18 Apr 2026',
    submittedBy: 'MCC Mysuru',
  },
  {
    id: 'DPR-2025-0838',
    title: 'Shivamogga Rural Broadband Connectivity',
    state: 'Karnataka',
    sector: 'Telecom',
    cost: '₹ 95 Cr',
    status: 'Pending',
    riskLevel: 'Medium',
    qualityScore: 67,
    submittedDate: '17 Apr 2026',
    submittedBy: 'Karnataka IT Dept',
  },
  {
    id: 'DPR-2025-0837',
    title: 'Karnataka Primary Health Center Upgrade',
    state: 'Karnataka',
    sector: 'Healthcare',
    cost: '₹ 48 Cr',
    status: 'Review',
    riskLevel: 'Low',
    qualityScore: 82,
    submittedDate: '16 Apr 2026',
    submittedBy: 'NHM Karnataka',
  },
  {
    id: 'DPR-2025-0836',
    title: 'Western Ghats Eco-Tourism Circuit',
    state: 'Karnataka',
    sector: 'Tourism',
    cost: '₹ 72 Cr',
    status: 'Rejected',
    riskLevel: 'High',
    qualityScore: 41,
    submittedDate: '15 Apr 2026',
    submittedBy: 'Karnataka Tourism Dept',
  },
  {
    id: 'DPR-2025-0835',
    title: 'Dharwad Agriculture Cold Chain Logistics',
    state: 'Karnataka',
    sector: 'Agriculture',
    cost: '₹ 112 Cr',
    status: 'Approved',
    riskLevel: 'Low',
    qualityScore: 85,
    submittedDate: '14 Apr 2026',
    submittedBy: 'KAPPEC Karnataka',
  },
];

export const recentDprs = mockDprs;

export const sectorBreakdown = [
  { name: 'Roads', value: 142, color: '#2196f3' },
  { name: 'Power', value: 89, color: '#f59e0b' },
  { name: 'Healthcare', value: 76, color: '#10b981' },
  { name: 'Education', value: 68, color: '#8b5cf6' },
  { name: 'Tourism', value: 54, color: '#06b6d4' },
  { name: 'Agriculture', value: 47, color: '#f97316' },
  { name: 'Urban', value: 48, color: '#ec4899' },
];

export const statePerformance = [
  { state: 'Bengaluru Urban', dprs: 142, avgScore: 88, utilisation: 92 },
  { state: 'Belagavi',        dprs: 98,  avgScore: 82, utilisation: 88 },
  { state: 'Mysuru',          dprs: 84,  avgScore: 85, utilisation: 91 },
  { state: 'Dakshina Kannada',dprs: 79,  avgScore: 84, utilisation: 89 },
  { state: 'Dharwad',         dprs: 65,  avgScore: 78, utilisation: 80 },
  { state: 'Kalaburagi',      dprs: 67,  avgScore: 71, utilisation: 68 },
  { state: 'Shivamogga',      dprs: 58,  avgScore: 79, utilisation: 82 },
  { state: 'Uttara Kannada',  dprs: 51,  avgScore: 73, utilisation: 79 },
];

export const riskAlerts = [
  {
    id: '1',
    dprId: 'DPR-2025-0842',
    title: 'NH-217 Highway Extension (Belagavi)',
    state: 'Karnataka',
    riskScore: 82,
    riskFactors: ['Monsoon drainage constraints', 'BOQ unit rate deviation from Karnataka PWD 2025 SoR', 'Missing geotechnical survey'],
    flaggedAt: '2 hours ago',
  },
  {
    id: '2',
    dprId: 'DPR-2025-0836',
    title: 'Western Ghats Eco-Tourism Circuit (Uttara Kannada)',
    state: 'Karnataka',
    riskScore: 76,
    riskFactors: ['Pending Forest Clearance (FCA 1980)', 'Budget underestimation (est. 23%)'],
    flaggedAt: '1 day ago',
  },
  {
    id: '3',
    dprId: 'DPR-2025-0840',
    title: 'Kalaburagi Power Grid Phase 2',
    state: 'Karnataka',
    riskScore: 73,
    riskFactors: ['Right of Way (RoW) utility shifting delay', 'Contractor qualification gaps'],
    flaggedAt: '2 days ago',
  },
];

export interface Recommendation {
  id: string;
  dprId: string;
  dprTitle: string;
  state: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionableSteps: string[];
  generatedAt: string;
}

export const recommendations: Recommendation[] = [
  {
    id: 'REC-001',
    dprId: 'DPR-2025-0842',
    dprTitle: 'NH-217 Four-Lane Highway Extension',
    state: 'Karnataka',
    category: 'Technical',
    priority: 'critical',
    title: 'Conduct advanced geotechnical investigation',
    description: 'The DPR lacks detailed soil bearing capacity data for bridge foundations in Belagavi district. Conduct Standard Penetration Test (SPT) at all proposed bridge locations.',
    impact: 'Reduces foundation failure risk by up to 40%',
    actionableSteps: [
      'Commission NABL-accredited geotechnical survey firm',
      'Conduct SPT at all 12 proposed bridge sites',
      'Update foundation design based on findings',
    ],
    generatedAt: '2 hours ago',
  },
  {
    id: 'REC-002',
    dprId: 'DPR-2025-0842',
    dprTitle: 'NH-217 Four-Lane Highway Extension',
    state: 'Karnataka',
    category: 'Financial',
    priority: 'critical',
    title: 'Increase cost contingency to 12%',
    description: 'Current contingency at 5% is below Karnataka PWD recommended 10-15% for heavy monsoon terrain projects.',
    impact: 'Prevents budget shortfall during construction phase',
    actionableSteps: [
      'Revise cost estimates with Karnataka PWD 2025-26 SoR rates',
      'Add 12% contingency provision as per MoRTH guidelines',
      'Submit revised financial plan to Karnataka PWD Finance Wing',
    ],
    generatedAt: '2 hours ago',
  },
  {
    id: 'REC-003',
    dprId: 'DPR-2025-0842',
    dprTitle: 'NH-217 Four-Lane Highway Extension',
    state: 'Karnataka',
    category: 'Timeline',
    priority: 'high',
    title: 'Add monsoon contingency buffer to timeline',
    description: 'Karnataka experiences 4 months of heavy monsoon (June-Sept). The current timeline does not account for weather-related work stoppages.',
    impact: 'Realistic timeline reduces schedule overrun by 30%',
    actionableSteps: [
      'Identify all monsoon-sensitive construction activities',
      'Add 3-month buffer for June-September monsoon season',
      'Plan indoor/preparatory work during monsoon months',
    ],
    generatedAt: '2 hours ago',
  },
  {
    id: 'REC-004',
    dprId: 'DPR-2025-0841',
    dprTitle: 'Bengaluru Logistics Park & Ring Road',
    state: 'Karnataka',
    category: 'Procurement',
    priority: 'high',
    title: 'Front-load procurement before monsoon season',
    description: 'Material transportation across Karnataka is impacted during heavy monsoon. Major material procurement should be completed by March.',
    impact: 'Avoids 2-3 month material shortage delays',
    actionableSteps: [
      'Prepare advance procurement schedule by January',
      'Identify local material sources as backup suppliers',
      'Pre-qualify contractors and vendors by December',
    ],
    generatedAt: '1 day ago',
  },
  {
    id: 'REC-005',
    dprId: 'DPR-2025-0841',
    dprTitle: 'Bengaluru Logistics Park & Ring Road',
    state: 'Karnataka',
    category: 'Environmental',
    priority: 'medium',
    title: 'Complete flood risk mitigation assessment',
    description: 'The logistics park site requires detailed flood-line mapping and raised platform stormwater drainage master plan.',
    impact: 'Prevents operational disruption during monsoon season',
    actionableSteps: [
      'Commission CWC flood-line survey for project site',
      'Design raised platform 2m above highest flood level',
      'Include stormwater drainage master plan in DPR',
    ],
    generatedAt: '1 day ago',
  },
];
