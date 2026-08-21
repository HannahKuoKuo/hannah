import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.response?.data?.error || error.message,
          statusCode: error.response?.status || 500,
          code: error.response?.data?.code
        };

        if (apiError.code === 'TOKEN_EXPIRED') {
          localStorage.removeItem('auth_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        throw apiError;
      }
    );
  }

  // Auth endpoints
  async register(data: { email: string; password: string; company_name?: string; full_name?: string }) {
    return this.client.post('/auth/register', data);
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async getProfile() {
    return this.client.get('/auth/profile');
  }

  async updateProfile(data: any) {
    return this.client.put('/auth/profile', data);
  }

  // Dashboard
  async getDashboard() {
    return this.client.get('/dashboard');
  }

  async refreshDashboard() {
    return this.client.get('/dashboard/refresh');
  }

  // MailerLite
  async getMailerliteAccounts() {
    return this.client.get('/mailerlite/accounts');
  }

  async getMailerliteCampaigns(limit = 50, offset = 0) {
    return this.client.get('/mailerlite/campaigns', { params: { limit, offset } });
  }

  async getMailerliteCampaignStats(campaignId: number) {
    return this.client.get(`/mailerlite/campaigns/${campaignId}/stats`);
  }

  async getMailerliteAnalytics(days = 30) {
    return this.client.get('/mailerlite/analytics', { params: { days } });
  }

  async syncMailerlite() {
    return this.client.post('/mailerlite/sync');
  }

  // Meta
  async getMetaAccounts() {
    return this.client.get('/meta/accounts');
  }

  async getMetaPosts(limit = 50, offset = 0, platform?: string) {
    return this.client.get('/meta/posts', { params: { limit, offset, platform } });
  }

  async getMetaPostInsights(postId: number) {
    return this.client.get(`/meta/posts/${postId}/insights`);
  }

  async getMetaAnalytics(days = 30) {
    return this.client.get('/meta/analytics', { params: { days } });
  }

  async syncMeta() {
    return this.client.post('/meta/sync');
  }

  // LinkedIn
  async getLinkedinAccounts() {
    return this.client.get('/linkedin/accounts');
  }

  async getLinkedinPosts(limit = 50, offset = 0) {
    return this.client.get('/linkedin/posts', { params: { limit, offset } });
  }

  async getLinkedinAnalytics(days = 30) {
    return this.client.get('/linkedin/analytics', { params: { days } });
  }

  async syncLinkedin() {
    return this.client.post('/linkedin/sync');
  }

  // GA4
  async getGA4Properties() {
    return this.client.get('/ga4/properties');
  }

  async getGA4Metrics(days = 30) {
    return this.client.get('/ga4/metrics', { params: { days } });
  }

  async getGA4TrafficSources(days = 30) {
    return this.client.get('/ga4/traffic-sources', { params: { days } });
  }

  async getGA4Conversions(days = 30) {
    return this.client.get('/ga4/conversions', { params: { days } });
  }

  async syncGA4() {
    return this.client.post('/ga4/sync');
  }

  // UTM
  async generateUTMLink(data: any) {
    return this.client.post('/utm/generate', data);
  }

  async getUTMLinks(limit = 100, offset = 0) {
    return this.client.get('/utm/links', { params: { limit, offset } });
  }

  async getUTMLinkStats(linkId: number) {
    return this.client.get(`/utm/links/${linkId}/stats`);
  }

  async recordUTMClick(linkId: number, data: any) {
    return this.client.post(`/utm/links/${linkId}/click`, data);
  }

  async deleteUTMLink(linkId: number) {
    return this.client.delete(`/utm/links/${linkId}`);
  }

  async getUTMCampaignSummary() {
    return this.client.get('/utm/campaign/summary');
  }

  // Content Calendar
  async getContentCalendar(limit = 50, offset = 0, status?: string) {
    return this.client.get('/content-calendar', { params: { limit, offset, status } });
  }

  async createContent(data: any) {
    return this.client.post('/content-calendar', data);
  }

  async getContentById(contentId: number) {
    return this.client.get(`/content-calendar/${contentId}`);
  }

  async updateContent(contentId: number, data: any) {
    return this.client.put(`/content-calendar/${contentId}`, data);
  }

  async deleteContent(contentId: number) {
    return this.client.delete(`/content-calendar/${contentId}`);
  }

  async publishContent(contentId: number) {
    return this.client.post(`/content-calendar/${contentId}/publish`);
  }

  // Reports
  async getReports(limit = 20, offset = 0, type?: string) {
    return this.client.get('/reports', { params: { limit, offset, type } });
  }

  async getReport(reportId: number) {
    return this.client.get(`/reports/${reportId}`);
  }

  async generateMonthlyReport(date?: string) {
    return this.client.post('/reports/generate/monthly', { date });
  }

  async generateWeeklyReport(date?: string) {
    return this.client.post('/reports/generate/weekly', { date });
  }

  async generateReportPDF(reportId: number) {
    return this.client.post(`/reports/generate/${reportId}/pdf`);
  }

  async deleteReport(reportId: number) {
    return this.client.delete(`/reports/${reportId}`);
  }

  async generateCustomReport(data: any) {
    return this.client.post('/reports/generate/custom', data);
  }

  async getReportTemplates() {
    return this.client.get('/reports/templates');
  }

  async getReportTemplate(templateId: number) {
    return this.client.get(`/reports/templates/${templateId}`);
  }

  async deleteReportTemplate(templateId: number) {
    return this.client.delete(`/reports/templates/${templateId}`);
  }

  async saveReportAsTemplate(reportId: number, templateName: string) {
    return this.client.post(`/reports/${reportId}/save-as-template`, { templateName });
  }

  // Analytics
  async getAnalyticsSummary(days = 30) {
    return this.client.get('/analytics/summary', { params: { days } });
  }

  async getAnalyticsComparison() {
    return this.client.get('/analytics/comparison');
  }

  async getAnalyticsChannels(days = 30) {
    return this.client.get('/analytics/channels', { params: { days } });
  }

  async getAnalyticsROI(days = 30) {
    return this.client.get('/analytics/roi', { params: { days } });
  }

  // A/B Testing
  async getABTests(status?: string, type?: string) {
    return this.client.get('/abtest', { params: { status, type } });
  }

  async getABTest(testId: number) {
    return this.client.get(`/abtest/${testId}`);
  }

  async createABTest(data: any) {
    return this.client.post('/abtest', data);
  }

  async updateABTestStatus(testId: number, status: string) {
    return this.client.put(`/abtest/${testId}/status`, { status });
  }

  async recordConversion(testId: number, variantId: string, revenue?: number) {
    return this.client.post(`/abtest/${testId}/convert`, { variantId, revenue });
  }

  async getABTestSummary() {
    return this.client.get('/abtest/summary/overview');
  }

  // Attribution & ROI Analysis
  async getAttributionAnalysis(model: string = 'last_touch', dateRange: number = 30) {
    return this.client.get('/attribution/analysis', { params: { model, dateRange } });
  }

  async getAttributionTimeline(model: string = 'last_touch') {
    return this.client.get('/attribution/timeline', { params: { model } });
  }

  async compareAttributionModels() {
    return this.client.get('/attribution/compare-models');
  }

  async getRoiMatrix(model: string = 'last_touch') {
    return this.client.get('/attribution/roi-matrix', { params: { model } });
  }

  // Roles and Permissions
  async getTeamMembers() {
    return this.client.get('/roles');
  }

  async getUserPermissions() {
    return this.client.get('/roles/permissions');
  }

  async updateMemberRole(memberId: number, role: string) {
    return this.client.put(`/roles/${memberId}/role`, { role });
  }

  async removeTeamMember(memberId: number) {
    return this.client.delete(`/roles/${memberId}`);
  }

  async resendInvite(memberId: number) {
    return this.client.post(`/roles/${memberId}/resend-invite`);
  }

  async getRolePermissions(role: string) {
    return this.client.get(`/roles/${role}/permissions`);
  }
}

export default new ApiClient();
