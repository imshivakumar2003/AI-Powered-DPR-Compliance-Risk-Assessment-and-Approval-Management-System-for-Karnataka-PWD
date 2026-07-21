// TOPLINE

// Centralized API client for the Karnataka PWD DPR-AI Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TrendDataPoint { month: string; submitted: number; approved: number; rejected: number; }
export interface DistrictDataPoint { district: string; total: number; approved: number; pending: number; rejected: number; }
export interface SectorDataPoint { sector: string; count: number; }
export interface RiskDistPoint { level: string; count: number; color: string; }
export interface StatusDistPoint { status: string; count: number; color: string; }

export interface RecentDpr {
  id: string; title: string; uploaded_by: string; district: string;
  upload_date: string; status: string; ai_score: number | null; risk_score: number | null; sector: string;
}

export interface ActivityItem {
  type: string; message: string; by: string; at: string; status: string;
}

export interface NotificationItem {
  type: string; message: string; icon: string;
}

export interface DashboardStats {
  total_dprs: number;
  approved_count: number;
  rejected_count: number;
  pending_review: number;
  need_verification: number;
  high_risk_projects: number;
  medium_risk_projects: number;
  low_risk_projects: number;
  total_fund_allocation_cr: number;
  unutilised_funds_cr: number;
  ai_reviews_completed: number;
  trend_data: TrendDataPoint[];
  district_data: DistrictDataPoint[];
  sector_data: SectorDataPoint[];
  risk_distribution: RiskDistPoint[];
  status_distribution: StatusDistPoint[];
  recent_dprs: RecentDpr[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
}

export interface DimensionScore {
  dimension: string;
  score: number;
  feedback: string;
}

export interface QualityAssessment {
  overall_score: number;
  status: string;
  dimensions: DimensionScore[];
}

export interface RiskPrediction {
  risk_score: number;
  risk_category: string;
  top_risk_factors: string[];
  mitigation_recommendations: string[];
}

export interface ComplianceCheck {
  id: string;
  label: string;
  description: string;
  is_mandatory: boolean;
  status: string;
  reason?: string;
}

export interface ProjectCompliance {
  project_id: string;
  overall_compliance_score: number;
  checks: ComplianceCheck[];
}

export interface Project {
  id: string;
  filename: string;
  status: string;
  upload_date: string;
  estimated_cost: number;
  sector: string;
  state: string;
  overall_score?: number;
  risk_score?: number;
  compliance_score?: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data if backend is unreachable
    return {
      total_dprs: 0,
      pending_review: 0,
      high_risk_projects: 0,
      total_fund_allocation_cr: 0,
      unutilised_funds_cr: 0,
    };
  }
}

export async function fetchDprQuality(dprId: string): Promise<QualityAssessment | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/assessment`);
    if (!res.ok) throw new Error('Failed to fetch assessment');
    return await res.json();
  } catch (error) {
    console.error(`Error fetching assessment for ${dprId}:`, error);
    return null;
  }
}

export async function fetchDprRisk(dprId: string): Promise<RiskPrediction | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/risk`);
    if (!res.ok) throw new Error('Failed to fetch risk prediction');
    return await res.json();
  } catch (error) {
    console.error(`Error fetching risk for ${dprId}:`, error);
    return null;
  }
}

export async function fetchDprCompliance(dprId: string): Promise<ProjectCompliance | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/compliance`);
    if (!res.ok) throw new Error('Failed to fetch compliance');
    return await res.json();
  } catch (error) {
    console.error(`Error fetching compliance for ${dprId}:`, error);
    return null;
  }
}

export async function downloadDprReport(dprId: string): Promise<void> {
  try {
    const url = `${API_BASE_URL}/api/dpr/${dprId}/report/download`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DPR_Assessment_${dprId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(`Error downloading report for ${dprId}:`, error);
  }
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export interface ApiRecommendation {
  id: string;
  dprId: string;
  dprTitle: string;
  state: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  actionableSteps: string[];
  generatedAt: string;
}

export async function fetchRecommendations(): Promise<ApiRecommendation[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return await res.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function approveDpr(
  dprId: string,
  decision: 'approve' | 'reject',
  comment: string
): Promise<{ id: string; status: string; comment: string }> {
  const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, comment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail || `Approval failed (${res.status})`);
  }
  return res.json();
}

export interface AppSettings {
  risk_threshold: number;
  email_alerts: boolean;
  auto_assign: boolean;
  language: string;
}

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return safe defaults if backend is unreachable
    return { risk_threshold: 70, email_alerts: true, auto_assign: true, language: 'en' };
  }
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail || `Failed to save settings (${res.status})`);
  }
  return res.json();
}

export interface DistrictAnalytic {
  district: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  under_review: number;
  avg_ai_score: number | null;
  avg_risk_score: number | null;
  avg_compliance: number | null;
  approval_rate: number;
  last_submission: string | null;
  color: string;
  has_data: boolean;
}

export interface RiskAlert {
  id: string;
  title: string;
  type: string;
  level: string;
  district: string;
  dpr_id: string;
  dpr_name: string;
  sector: string;
  description: string;
  recommendation: string;
  mitigation: string;
  status: string;
  created_at: string;
  dpr_status: string;
  risk_score: number;
}

export async function fetchDistrictAnalytics(): Promise<DistrictAnalytic[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/districts`);
    if (!res.ok) throw new Error('Failed to fetch district analytics');
    return await res.json();
  } catch (error) {
    console.error('Error fetching district analytics:', error);
    return [];
  }
}

export async function fetchRiskAlerts(): Promise<RiskAlert[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/risk-alerts`);
    if (!res.ok) throw new Error('Failed to fetch risk alerts');
    return await res.json();
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    return [];
  }
}
