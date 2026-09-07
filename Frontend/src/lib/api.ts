// TOPLINE

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role?: string;
  username?: string;
  full_name?: string;
  email?: string;
  department?: string;
  id?: number | string;
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  });
  if (!res.ok) {
    let msg = 'Invalid Login ID or password';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function registerUser(data: { username: string; password: string; full_name: string; email: string; state?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = 'Registration failed. Please try again.';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
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
  groq_api_key?: string;
  theme?: 'light' | 'dark' | 'system';
}

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return safe defaults if backend is unreachable
    return { risk_threshold: 70, email_alerts: true, auto_assign: true, language: 'en', groq_api_key: '', theme: 'system' };
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

// ── Document Intelligence, RAG & LLM Types & API ─────────────────────────────

export interface ExtractedDocument {
  project_id: string;
  full_text: string;
  total_pages: number;
  word_count: number;
  character_count: number;
  extraction_method: string;
  has_ocr: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface DocumentPage {
  id?: string;
  page_number: number;
  text?: string;
  page_text?: string;
  word_count: number;
  character_count: number;
  is_ocr: boolean;
}

export interface RagChunk {
  id?: string;
  chunk_index: number;
  page_number: number;
  chunk_text: string;
  heading: string;
  token_count?: number;
  score?: number;
}

export interface RagQueryResult {
  project_id: string;
  query: string;
  answer: string;
  cited_pages: number[];
  chunks_used: RagChunk[];
  engine: string;
}

export interface DprExtractedImage {
  id?: string;
  dpr_id: string;
  page_number: number;
  image_index: number;
  filename: string;
  image_url: string;
  width: number;
  height: number;
  position_y: number;
  image_type: string;
  type_label: string;
  ai_description: string;
  ai_tags?: string[];
  upload_timestamp?: string;
}

export interface MultiDocRagResult {
  query: string;
  answer: string;
  cited_projects: string[];
  cited_pages: number[];
  chunks_used: Array<RagChunk & { project_id?: string; project_title?: string; image_url?: string; image_type?: string }>;
  confidence_score: number;
  engine: string;
}

export interface DqciDimension {
  name: string;
  max: number;
  score: number;
  feedback: string;
}

export interface DqciScore {
  overall_dqci: number;
  grade: string;
  total_pages: number;
  total_words: number;
  total_images: number;
  dimensions: DqciDimension[];
  status: string;
}

export interface PavementLayer {
  layer: string;
  thickness: string;
  standard: string;
}

export interface KnowledgeExtractionResult {
  project_id: string;
  briefings: {
    title: string;
    executive_summary: string;
    technical_brief: string;
    financial_brief: string;
    clearances_brief: string;
    risk_brief: string;
    entities: {
      pavement_layers: PavementLayer[];
      geotechnical: Record<string, string>;
      structures: Record<string, any>;
      financial_audit: Record<string, any>;
      statutory_standards: string[];
      geographic_entities: Record<string, any>;
    };
  };
  dqci: DqciScore;
  entities: any;
}

export interface ComplianceAuditCheck {
  code: string;
  standard_title: string;
  parameter: string;
  requirement: string;
  status: string;
  observed_value: string;
  risk_level: string;
}

export interface ComplianceAuditResult {
  compliance_score: number;
  total_checks: number;
  passed_checks: number;
  standard: string;
  checks: ComplianceAuditCheck[];
}

export interface DprComparisonProject {
  id: string;
  title: string;
  sector: string;
  district: string;
  status: string;
  total_cost_cr: number;
  civil_cost_cr: number;
  land_acquisition_cr: number;
  subgrade_cbr: string;
  design_traffic: string;
  design_speed: string;
  total_pages: number;
  word_count: number;
  images_count: number;
  dqci_score: number;
}

export interface DprComparisonResult {
  total_projects_compared: number;
  total_capital_outlay_cr: number;
  average_project_cost_cr: number;
  projects: DprComparisonProject[];
}

export interface LlmTechnicalSpecs {
  pavement_type?: string;
  lane_configuration?: string;
  carriageway_width?: string;
  design_speed?: string;
  subgrade_cbr?: string;
  total_length_km?: number;
  major_bridges?: number;
  minor_bridges?: number;
  culverts?: number;
}

export interface LlmFinancialBreakdown {
  civil_works_cost_cr?: number;
  land_acquisition_cost_cr?: number;
  utility_shifting_cost_cr?: number;
  contingency_cost_cr?: number;
  total_estimated_cost_cr?: number;
  cost_per_km_cr?: number;
}

export interface LlmClearance {
  name: string;
  status: string;
  details: string;
}

export interface LlmRisk {
  risk: string;
  severity: string;
  mitigation: string;
}

export interface LlmCompliance {
  standard: string;
  status: string;
  note: string;
}

export interface LlmInsights {
  project_id: string;
  summary: string;
  objectives: string[];
  technical_specs: LlmTechnicalSpecs;
  financial_breakdown: LlmFinancialBreakdown;
  clearances: LlmClearance[];
  risks: LlmRisk[];
  compliance: LlmCompliance[];
  created_at?: string;
}

export async function fetchExtractedDocument(dprId: string): Promise<ExtractedDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/extracted-document`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching extracted doc:', err);
    return null;
  }
}

export async function fetchExtractedPages(dprId: string): Promise<DocumentPage[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/extracted-pages`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.pages || [];
  } catch (err) {
    console.error('Error fetching pages:', err);
    return [];
  }
}

export async function fetchRagChunks(dprId: string): Promise<RagChunk[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/rag/chunks`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.chunks || [];
  } catch (err) {
    console.error('Error fetching RAG chunks:', err);
    return [];
  }
}

export async function queryDprRag(dprId: string, query: string, topK: number = 4): Promise<RagQueryResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/rag/query`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error querying DPR RAG:', err);
    return null;
  }
}

export async function fetchLlmInsights(dprId: string): Promise<LlmInsights | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/llm/insights`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching LLM insights:', err);
    return null;
  }
}

export async function triggerDprIntelligenceExtraction(dprId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/extract-intelligence`, {
      method: 'POST',
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error triggering intelligence extraction:', err);
    return null;
  }
}

export async function fetchDprImages(dprId: string, pageNumber?: number): Promise<DprExtractedImage[]> {
  try {
    const url = pageNumber !== undefined
      ? `${API_BASE_URL}/api/dpr/${dprId}/pages/${pageNumber}/images`
      : `${API_BASE_URL}/api/dpr/${dprId}/images`;
    const res = await fetch(url, { headers: getUserHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.images || [];
  } catch (err) {
    console.error('Error fetching DPR images:', err);
    return [];
  }
}

export async function queryMultiDprRag(query: string, projectIds?: string[], topK: number = 6): Promise<MultiDocRagResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/rag/multi-query`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, project_ids: projectIds, top_k: topK }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error in multi-DPR RAG query:', err);
    return null;
  }
}

export async function fetchKnowledgeExtraction(dprId: string): Promise<KnowledgeExtractionResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/knowledge-extraction`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching knowledge extraction:', err);
    return null;
  }
}

export async function fetchComplianceAudit(dprId: string): Promise<ComplianceAuditResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/compliance-audit`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching compliance audit:', err);
    return null;
  }
}

export async function compareDprs(projectIds: string[]): Promise<DprComparisonResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/compare`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_ids: projectIds }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error comparing DPRs:', err);
    return null;
  }
}

export interface ChatbotCitedImage {
  filename: string;
  image_url: string;
  page_number: number;
  image_type: string;
  type_label: string;
  ai_description: string;
}

export interface ChatbotQueryResponse {
  dpr_id: string;
  project_title: string;
  query: string;
  answer: string;
  language: string;
  direct_answer?: string;
  simple_explanation?: string;
  key_insights?: string[];
  source_section?: string;
  cited_pages: number[];
  cited_images: ChatbotCitedImage[];
  follow_up_suggestions: string[];
  guidelines_applied: string[];
  confidence_score: number;
  confidence_level?: string;
  engine: string;
}

export async function queryAiChatbot(
  dprId: string,
  query: string,
  language: string = 'en',
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<ChatbotQueryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chatbot/query`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dpr_id: dprId,
        query,
        language,
        conversation_history: conversationHistory,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error querying AI Chatbot:', err);
    return null;
  }
}

export async function exportChatTranscript(
  dprId: string,
  messages: any[]
): Promise<{ dpr_id: string; filename: string; transcript: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chatbot/export-transcript`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dpr_id: dprId, messages }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error exporting chat transcript:', err);
    return null;
  }
}

export interface ExplainableRecommendation {
  id: string;
  category: string;
  priority: string;
  impact: string;
  confidence_score: number;
  title: string;
  reason: string;
  explanation?: string;
  description?: string;
  dpr_page_numbers: number[];
  dpr_section_name: string;
  supporting_evidence: string;
  guideline_reference: string;
  suggested_action: string;
  actionable_steps: string[];
}

export interface AiScoreExplanationItem {
  score: number;
  grade: string;
  color: string;
  weight_pct: number;
  formula: string;
  description: string;
}

export interface KeyFindings {
  observations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface OpportunityItem {
  title: string;
  savings_amount?: string;
  time_saved?: string;
  benefit?: string;
  impact: string;
  description: string;
  steps?: string;
}

export interface TopOpportunities {
  cost_savings: OpportunityItem[];
  timeline_improvements: OpportunityItem[];
  resource_optimization: OpportunityItem[];
  quality_improvements: OpportunityItem[];
}

export interface CriticalAlert {
  type: string;
  title: string;
  severity?: string;
  dpr_page?: number;
  description?: string;
  mandatory_action?: string;
}

export interface CriticalAlertsDict {
  high_risk_issues: string[];
  compliance_violations: string[];
  missing_documents: string[];
  incomplete_information: string[];
}

export interface SuggestionsInsights {
  key_findings: KeyFindings;
  top_opportunities: TopOpportunities;
  critical_alerts: CriticalAlertsDict;
}

export interface RiskSuggestionItem {
  risk_category: string;
  title: string;
  description: string;
  impact_level: string;
  probability_pct: number;
  mitigation_strategy: string;
  dpr_page_reference: number;
  guideline_reference: string;
}

export interface ComplianceSuggestionItem {
  guideline_code: string;
  guideline_name: string;
  requirement_description: string;
  current_finding: string;
  compliance_status: string;
  severity: string;
  corrective_action: string;
  statutory_reference: string;
}

export interface CorrectionItem {
  category: string;
  description: string;
  severity: string;
  page_number: number;
  resolution_steps: string;
}

export interface ImprovementSuggestions {
  technical_improvements: Array<{ title: string; benefit: string; effort: string; recommendation: string }>;
  budget_optimization: Array<{ title: string; cost_impact: string; feasibility: string; recommendation: string }>;
  timeline_optimization: Array<{ title: string; time_saved: string; critical_path: string; recommendation: string }>;
  resource_utilization: Array<{ title: string; efficiency_gain: string; recommendation: string }>;
  sustainability_enhancements: Array<{ title: string; green_rating: string; recommendation: string }>;
  documentation_improvements: Array<{ title: string; completeness_gain: string; recommendation: string }>;
}

export interface EvidenceReferenceItem {
  dpr_page_number: number;
  section_name: string;
  supporting_evidence: string;
  ocr_source_excerpt: string;
  rag_retrieval_context: string;
  guideline_reference: string;
  suggested_action: string;
}

export interface SuggestionsAnalytics {
  risk_distribution: Array<{ name: string; value: number; color: string }>;
  compliance_breakdown: Array<{ name: string; score: number; target: number }>;
  quality_radar: Array<{ subject: string; score: number; fullMark: number }>;
  readiness_trends: Array<{ stage: string; readiness: number; target: number }>;
  recommendation_categories: Array<{ category: string; count: number; color: string }>;
}

export interface ComprehensiveSuggestionsData {
  dpr_id: string;
  project_title: string;
  sector: string;
  district: string;
  state: string;
  estimated_cost_cr: number;
  upload_date: string;
  status: string;
  total_pages: number;
  total_recommendations: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  scores: {
    overall_ai_score: number;
    dpr_quality_score: number;
    compliance_score: number;
    risk_score: number;
    technical_score: number;
    financial_score: number;
    documentation_score: number;
    approval_readiness_score: number;
    confidence_score: number;
    ocr_accuracy: number;
    rag_confidence: number;
    recommendation_score: number;
    grade: string;
    color: string;
  };
  score_explanations: Record<string, AiScoreExplanationItem>;
  recommendations: ExplainableRecommendation[];
  insights: SuggestionsInsights;
  risk_suggestions: RiskSuggestionItem[];
  compliance_suggestions: ComplianceSuggestionItem[];
  corrections_required: CorrectionItem[];
  improvement_suggestions: ImprovementSuggestions;
  evidence_references: EvidenceReferenceItem[];
  analytics: SuggestionsAnalytics;
  generated_at: string;
}

export interface SuggestionsDashboardProject {
  dpr_id: string;
  title: string;
  sector: string;
  district: string;
  status: string;
  upload_date: string;
  estimated_cost_cr: number;
  scores: Record<string, any>;
  total_recommendations: number;
  critical_count: number;
  high_count: number;
  top_recommendations: ExplainableRecommendation[];
  critical_alerts: CriticalAlert[];
}

export interface SuggestionsDashboardData {
  total_projects: number;
  total_recommendations: number;
  total_critical: number;
  total_high: number;
  total_estimated_savings_cr: number;
  projects: SuggestionsDashboardProject[];
}

export interface DprInsightsDashboard {
  dpr_id: string;
  project_title: string;
  sector: string;
  district: string;
  estimated_cost_cr: number;
  compliance_score: number;
  dqci_quality_score: number;
  dqci_grade: string;
  cost_risk_score: string;
  schedule_risk_score: string;
  approval_readiness_score: number;
  missing_information_alerts: string[];
  top_risks: Array<{ risk: string; impact: string; mitigation: string }>;
}

export interface DprDeepRecommendationsResult {
  dpr_id: string;
  project_title: string;
  total_recommendations: number;
  critical_count: number;
  high_count: number;
  dashboard: DprInsightsDashboard;
  recommendations: ExplainableRecommendation[];
}

export async function fetchDprDeepRecommendations(dprId: string): Promise<DprDeepRecommendationsResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/recommendations`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching deep recommendations:', err);
    return null;
  }
}

export async function fetchComprehensiveSuggestions(dprId: string): Promise<ComprehensiveSuggestionsData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/comprehensive-suggestions`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching comprehensive suggestions:', err);
    return null;
  }
}

export async function fetchSuggestionsDashboard(): Promise<SuggestionsDashboardData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/suggestions/dashboard`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching suggestions dashboard:', err);
    return null;
  }
}

export interface DepartmentStage {
  stage_index: number;
  department_key: string;
  department_name: string;
  authority: string;
  role_title: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  reviewer_name?: string | null;
  reviewer_role?: string | null;
  comments?: string;
  digital_signature?: string | null;
  reviewed_at?: string | null;
}

export interface ApprovalCertificate {
  sanction_order_no: string;
  digital_hash: string;
  issued_by: string;
  approving_authority: string;
  allotted_budget_cr: number;
  sanction_date: string;
  status: string;
  qr_verification_url: string;
}

export interface DprApprovalWorkflow {
  dpr_id: string;
  current_stage: string;
  overall_status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'NEEDS_REVISION' | 'REJECTED' | 'FINAL_APPROVED' | string;
  stages: DepartmentStage[];
  certificate?: ApprovalCertificate | null;
  project_title?: string;
  sector?: string;
  estimated_cost?: number;
  state?: string;
  upload_date?: string;
  overall_ai_score?: number;
  dpr_quality_score?: number;
  compliance_score?: number;
  risk_score?: number;
  technical_score?: number;
  financial_score?: number;
  documentation_score?: number;
  approval_readiness_score?: number;
  confidence_score?: number;
  ocr_accuracy?: number;
  rag_confidence?: number;
  recommendation_score?: number;
  grade?: string;
  color?: string;
}

export interface AiApprovalAssistantInsights {
  dpr_id: string;
  ai_recommendation: string;
  recommendation_badge: 'RECOMMEND_APPROVAL' | 'CONDITIONAL_APPROVAL' | 'RECOMMEND_REVISION';
  rationale: string;
  compliance_score: number;
  dqci_quality_score: number;
  dqci_grade: string;
  risk_score: number;
  approval_readiness_score: number;
  suggested_corrections: string[];
  pavement_summary: string;
  subgrade_cbr: string;
  total_cost_cr: number;
}

export interface DprWorkflowDetailResponse {
  dpr_id: string;
  project_title: string;
  sector: string;
  estimated_cost: number;
  district: string;
  state: string;
  status: string;
  workflow: DprApprovalWorkflow;
  ai_insights: AiApprovalAssistantInsights;
}

export interface ApprovalsDashboardKpis {
  total_dprs: number;
  pending_approvals: number;
  approved_dprs: number;
  rejected_dprs: number;
  needs_revision: number;
  completion_percentage: number;
  average_turnaround_days: number;
  department_pending_counts: Record<string, number>;
  workflows: DprApprovalWorkflow[];
}

export async function fetchApprovalsDashboard(): Promise<ApprovalsDashboardKpis | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/approvals/dashboard`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching approvals dashboard:', err);
    return null;
  }
}

export async function fetchDprWorkflowDetail(dprId: string): Promise<DprWorkflowDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/workflow`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching DPR workflow detail:', err);
    return null;
  }
}

export async function submitDepartmentApprovalAction(
  dprId: string,
  department: string,
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
  reviewerName: string,
  reviewerRole: string,
  comments: string
): Promise<{ success: boolean; error?: string; certificate?: ApprovalCertificate } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/workflow/action`, {
      method: 'POST',
      headers: {
        ...getUserHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        department,
        decision,
        reviewer_name: reviewerName,
        reviewer_role: reviewerRole,
        comments,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.detail || 'Failed to process approval action' };
    }
    return await res.json();
  } catch (err) {
    console.error('Error submitting approval action:', err);
    return { success: false, error: 'Network or server error' };
  }
}

export async function fetchDprCertificate(dprId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/certificate`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching certificate:', err);
    return null;
  }
}

// ── Visual Representation & Analytics Interfaces ──
export interface VisualKPIs {
  total_dprs: number;
  approved_dprs: number;
  pending_dprs: number;
  rejected_dprs: number;
  under_review_dprs: number;
  total_users: number;
  active_users: number;
  total_departments: number;
  approval_rate_pct: number;
  avg_approval_time_days: number;
  high_risk_dprs: number;
  medium_risk_dprs: number;
  low_risk_dprs: number;
  total_budget_cr: number;
  approved_budget_cr: number;
  rejected_budget_cr: number;
  pending_budget_cr: number;
}

export interface VisualStatusDist {
  name: string;
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DepartmentPerformanceItem {
  department: string;
  approved: number;
  rejected: number;
  pending: number;
  total_reviews: number;
  avg_review_time_days: number;
  target_sla_days: number;
  compliance_rate_pct: number;
}

export interface MonthlySubmissionPoint {
  month: string;
  full_month: string;
  submitted: number;
  approved: number;
  rejected: number;
  under_review: number;
}

export interface RiskHeatmapCell {
  district: string;
  category: string;
  value: number;
  risk_level: string;
  color: string;
}

export interface RiskTopCategory {
  category: string;
  count: number;
  avg_score: number;
  severity: string;
}

export interface GuidelineStatItem {
  guideline: string;
  name: string;
  compliance_rate_pct: number;
  total_checked: number;
  passed: number;
  flagged: number;
}

export interface ApprovalBottleneckItem {
  stage: string;
  pending_count: number;
  avg_wait_days: number;
  severity: string;
  sla_target: number;
}

export interface DelayedDprItem {
  id: string;
  title: string;
  department: string;
  days_pending: number;
  delay_reason: string;
  priority: string;
}

export interface UserSubmissionRank {
  username: string;
  name: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface BudgetDistributionItem {
  category: string;
  budget_cr: number;
  percentage: number;
}

export interface CostRiskItem {
  id: string;
  title: string;
  estimated_cost_cr: number;
  variance_risk_pct: number;
  risk_level: string;
}

export interface VisualDprItem {
  id: string;
  title: string;
  district: string;
  department: string;
  submitted_by: string;
  upload_date: string;
  status: string;
  overall_score?: number | null;
  risk_score?: number | null;
  compliance_score?: number | null;
  estimated_cost?: number;
  sector?: string;
}

export interface VisualRepresentationData {
  kpis: VisualKPIs;
  status_distribution: VisualStatusDist[];
  department_performance: DepartmentPerformanceItem[];
  monthly_submission_trend: MonthlySubmissionPoint[];
  risk_analytics: {
    distribution: { name: string; count: number; color: string }[];
    top_categories: RiskTopCategory[];
    heatmap: RiskHeatmapCell[];
  };
  compliance_analytics: {
    score_distribution: { range: string; count: number; color: string }[];
    guideline_statistics: GuidelineStatItem[];
  };
  approval_analytics: {
    avg_approval_time_days: number;
    bottlenecks: ApprovalBottleneckItem[];
    delayed_dprs: DelayedDprItem[];
    success_rate_pct: number;
  };
  user_analytics: {
    dprs_per_user: UserSubmissionRank[];
    department_users: { department: string; user_count: number }[];
    active_users: number;
    total_users: number;
  };
  financial_analytics: {
    total_budget_cr: number;
    approved_budget_cr: number;
    rejected_budget_cr: number;
    pending_budget_cr: number;
    budget_distribution: BudgetDistributionItem[];
    cost_risk_analysis: CostRiskItem[];
  };
  filters_meta: {
    departments: string[];
    districts: string[];
    sectors: string[];
  };
  dprs: VisualDprItem[];
}

export async function fetchVisualRepresentationAnalytics(params?: {
  date_range?: string;
  department?: string;
  district?: string;
  status?: string;
  search?: string;
}): Promise<VisualRepresentationData | null> {
  try {
    const q = new URLSearchParams();
    if (params?.date_range) q.set('date_range', params.date_range);
    if (params?.department && params.department !== 'all') q.set('department', params.department);
    if (params?.district && params.district !== 'all') q.set('district', params.district);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/analytics/visual-representation${queryStr}`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch visual representation analytics');
    return await res.json();
  } catch (err) {
    console.error('Error fetching visual representation analytics:', err);
    return null;
  }
}

// ── Centralized AI Scores & Intelligence Types ──
export interface ScoreDetail {
  score: number;
  grade: 'Excellent' | 'Good' | 'Moderate' | 'Critical';
  color: string;
  weight_pct: number;
  formula: string;
  description: string;
}

export interface PageReference {
  page_number: number;
  section_name: string;
  finding_type: 'compliance' | 'risk' | 'technical' | 'financial' | 'quality';
  text_excerpt: string;
  impact_level: 'High' | 'Medium' | 'Low';
}

export interface DprAiScores {
  dpr_id: string;
  project_title: string;
  sector: string;
  status: string;
  overall_ai_score: number;
  dpr_quality_score: number;
  compliance_score: number;
  risk_score: number;
  safety_score: number;
  technical_score: number;
  financial_score: number;
  documentation_score: number;
  approval_readiness_score: number;
  confidence_score: number;
  ocr_accuracy: number;
  rag_confidence: number;
  recommendation_score: number;
  grade: string;
  color: string;
  explainability: Record<string, ScoreDetail>;
  page_references: PageReference[];
  historical_snapshots: {
    stage: string;
    overall_ai_score: number;
    compliance_score: number;
    risk_score: number;
    timestamp: string;
  }[];
}

export async function fetchDprAiScores(dprId: string): Promise<DprAiScores | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/ai-scores`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch AI scores for ${dprId}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching DPR AI scores:', err);
    return null;
  }
}

export async function fetchDprScoresExplainability(dprId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/dpr/${dprId}/scores-explainability`, {
      headers: getUserHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch scores explainability for ${dprId}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching scores explainability:', err);
    return null;
  }
}







