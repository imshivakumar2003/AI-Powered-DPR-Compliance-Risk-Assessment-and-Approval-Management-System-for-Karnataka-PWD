// TOPLINE

// Centralized API client for the Karnataka PWD DPR-AI Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getUserHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.username) headers['X-User-Name'] = u.username;
        if (u.role) headers['X-User-Role'] = u.role;
        if (u.id) headers['X-User-Id'] = String(u.id);
      } catch (e) {}
    } else {
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');
      if (username) headers['X-User-Name'] = username;
      if (role) headers['X-User-Role'] = role;
    }
  }
  return headers;
}

export interface TrendDataPoint { month: string; submitted: number; approved: number; rejected: number; }
export interface DistrictDataPoint { district: string; total: number; approved: number; pending: number; rejected: number; }
export interface SectorDataPoint { sector: string; count: number; }
export interface RiskDistPoint { level: string; count: number; color: string; }
export interface StatusDistPoint { status: string; count: number; color: string; }

export interface RecentDpr {
  id: string; title: string; uploaded_by: string; district: string;
  upload_date: string; status: string; ai_score: number | null; risk_score: number | null; sector: string;
  estimated_cost?: number; overall_score?: number;
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
  title?: string;
  district?: string;
  submitted_by?: string;
  submitted_by_id?: string;
  submitted_by_name?: string;
  department?: string;
  reviewed_by?: string;
  approval_comment?: string;
  original_filename?: string;
  overall_score?: number;
  risk_score?: number;
  compliance_score?: number;
  in_approvals?: boolean;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, { headers: getUserHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return await res.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data if backend is unreachable
    return {
      total_dprs: 0,
      approved_count: 0,
      rejected_count: 0,
      pending_review: 0,
      need_verification: 0,
      high_risk_projects: 0,
      medium_risk_projects: 0,
      low_risk_projects: 0,
      total_fund_allocation_cr: 0,
      unutilised_funds_cr: 0,
      ai_reviews_completed: 0,
      trend_data: [],
      district_data: [],
      sector_data: [],
      risk_distribution: [],
      status_distribution: [],
      recent_dprs: [],
      activities: [],
      notifications: [],
    };
  }
}

export async function fetchDprQuality(dprId: string): Promise<QualityAssessment | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/assessment`, { headers: getUserHeaders() });
    if (!res.ok) throw new Error('Failed to fetch assessment');
    return await res.json();
  } catch (error) {
    console.error(`Error fetching assessment for ${dprId}:`, error);
    return null;
  }
}

export async function fetchDprRisk(dprId: string): Promise<RiskPrediction | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/risk`, { headers: getUserHeaders() });
    if (!res.ok) throw new Error('Failed to fetch risk prediction');
    return await res.json();
  } catch (error) {
    console.error(`Error fetching risk for ${dprId}:`, error);
    return null;
  }
}

export async function fetchDprCompliance(dprId: string): Promise<ProjectCompliance | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/compliance`, { headers: getUserHeaders() });
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
    const res = await fetch(url, { headers: getUserHeaders() });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Karnataka_PWD_Official_DPR_Report_${dprId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(`Error downloading report for ${dprId}:`, error);
    // Fallback: direct window open if fetch fails
    window.open(`${API_BASE_URL}/api/dpr/${dprId}/report/download`, '_blank');
  }
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects`, { headers: getUserHeaders() });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function deleteDpr(dprId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}`, {
      method: 'DELETE',
      headers: getUserHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to delete DPR');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting DPR:', error);
    return { success: false, message: error.message || 'Error deleting DPR' };
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
    const res = await fetch(`${API_BASE_URL}/api/recommendations`, { headers: getUserHeaders() });
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

export async function downloadDprReportPdf(dprId: string, filename?: string): Promise<void> {
  const url = `${API_BASE_URL}/api/dpr/${dprId}/report/download`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Report download failed (${res.status})`);
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename || `Karnataka_PWD_DPR_Report_${dprId}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
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
    const res = await fetch(`${API_BASE_URL}/api/analytics/risk-alerts`, { headers: getUserHeaders() });
    if (!res.ok) throw new Error('Failed to fetch risk alerts');
    return await res.json();
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    return [];
  }
}

export interface GlobalNotification {
  id: string;
  project_id: string;
  recipient_role: string;
  recipient_name: string;
  event_type: string;
  message: string;
  is_read: number;
  created_at: string;
  project_title?: string;
  district?: string;
  sector?: string;
}

export async function fetchGlobalNotifications(role?: string, projectId?: string): Promise<GlobalNotification[]> {
  try {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (projectId) params.append('project_id', projectId);
    const res = await fetch(`${API_BASE_URL}/api/notifications?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return await res.json();
  } catch (error) {
    console.error('Error fetching global notifications:', error);
    return [];
  }
}

export async function markAllNotificationsRead(role?: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all?${params.toString()}`, { method: 'POST' });
    return res.ok;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function markSingleNotificationRead(notifId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, { method: 'POST' });
    return res.ok;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// ─── DPR Templates API ───────────────────────────────────────────────────────

export interface DprTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  filename: string;
  original_filename: string;
  version: string;
  is_active: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export async function fetchTemplates(activeOnly?: boolean): Promise<DprTemplate[]> {
  try {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('active_only', activeOnly ? 'true' : 'false');
    const res = await fetch(`${API_BASE_URL}/api/templates?${params.toString()}`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch templates');
    return await res.json();
  } catch (error) {
    console.error('Error fetching DPR templates:', error);
    return [];
  }
}

export async function fetchTemplateDetail(id: string): Promise<DprTemplate | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching template detail:', error);
    return null;
  }
}

export async function uploadTemplate(formData: FormData): Promise<DprTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/templates/upload`, {
    method: 'POST',
    headers: getUserHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to upload template');
  }
  return await res.json();
}

export async function updateTemplate(id: string, formData: FormData): Promise<DprTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
    method: 'PUT',
    headers: getUserHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Update failed' }));
    throw new Error(err.detail || 'Failed to update template');
  }
  return await res.json();
}

export async function toggleTemplateStatus(id: string, isActive: boolean): Promise<DprTemplate> {
  const res = await fetch(`${API_BASE_URL}/api/templates/${id}/status`, {
    method: 'PATCH',
    headers: {
      ...getUserHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Status change failed' }));
    throw new Error(err.detail || 'Failed to change template status');
  }
  return await res.json();
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
    method: 'DELETE',
    headers: getUserHeaders(),
  });
  return res.ok;
}

export function downloadTemplateFile(id: string, filename: string) {
  const url = `${API_BASE_URL}/api/templates/${id}/download`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'dpr_template.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function fetchApplicationStatusDetail(projectId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/application-status/${projectId}`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching status detail:', error);
    return null;
  }
}

