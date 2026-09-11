import { 
  Lead, 
  Student, 
  Mentor, 
  Expense, 
  CourseProgram, 
  Cohort, 
  Invoice, 
  MentorshipSession, 
  OrganizationSettings, 
  NotificationItem,
  AuthUser,
  ExpenseStatus,
  AttendanceRecord,
  LMSModule,
  StudentAssignmentSubmission,
  StudentPerformanceReport
} from '../types/crm';

const API_BASE_URL = '/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.data !== undefined ? json.data : json;
    } catch (error) {
      console.warn(`[API Offline Fallback] ${endpoint}:`, error);
      return null;
    }
  }

  // Bootstrap initial dataset
  async bootstrap() {
    return this.request<{
      leads: Lead[];
      students: Student[];
      mentors: Mentor[];
      expenses: Expense[];
      courses: CourseProgram[];
      cohorts: Cohort[];
      invoices: Invoice[];
      sessions: MentorshipSession[];
      settings: OrganizationSettings;
      notifications: NotificationItem[];
      staffUsers: AuthUser[];
      attendance?: AttendanceRecord[];
      lmsModules?: LMSModule[];
      assignments?: StudentAssignmentSubmission[];
    }>('/bootstrap');
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  // Reset database
  async resetDatabase() {
    return this.request('/reset', { method: 'POST' });
  }

  // Leads
  async getLeads(): Promise<Lead[] | null> {
    return this.request<Lead[]>('/leads');
  }

  async createLead(leadData: Omit<Lead, 'id' | 'dateAdded'>): Promise<Lead | null> {
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async convertLead(id: string, program: string, mentorName: string) {
    return this.request<{ student: Student; invoice: Invoice; lead: Lead }>(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({ program, mentorName }),
    });
  }

  // Students
  async getStudents(): Promise<Student[] | null> {
    return this.request<Student[]>('/students');
  }

  async createStudent(studentData: Omit<Student, 'id' | 'enrolledDate' | 'studentCode'>): Promise<Student | null> {
    return this.request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student | null> {
    return this.request<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async sendPaymentReminder(id: string) {
    return this.request(`/students/${id}/payment-reminder`, {
      method: 'POST',
    });
  }

  // Mentors
  async getMentors(): Promise<Mentor[] | null> {
    return this.request<Mentor[]>('/mentors');
  }

  async createMentor(mentorData: Omit<Mentor, 'id' | 'joinedDate' | 'mentorCode' | 'sessionsCount'>): Promise<Mentor | null> {
    return this.request<Mentor>('/mentors', {
      method: 'POST',
      body: JSON.stringify(mentorData),
    });
  }

  async updateMentor(id: string, data: Partial<Mentor>): Promise<Mentor | null> {
    return this.request<Mentor>(`/mentors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Expenses
  async getExpenses(): Promise<Expense[] | null> {
    return this.request<Expense[]>('/expenses');
  }

  async createExpense(expenseData: Omit<Expense, 'id' | 'expenseCode'>): Promise<Expense | null> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpenseStatus(id: string, status: ExpenseStatus, extra?: { rejectionReason?: string; reviewedBy?: string; reviewedAt?: string }): Promise<Expense | null> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    });
  }

  // Courses & Cohorts
  async getCourses(): Promise<CourseProgram[] | null> {
    return this.request<CourseProgram[]>('/courses');
  }

  async createCourse(courseData: Omit<CourseProgram, 'id' | 'enrolledCount' | 'rating'>): Promise<CourseProgram | null> {
    return this.request<CourseProgram>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id: string, data: Partial<CourseProgram>): Promise<CourseProgram | null> {
    return this.request<CourseProgram>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCohorts(): Promise<Cohort[] | null> {
    return this.request<Cohort[]>('/cohorts');
  }

  async createCohort(cohortData: Omit<Cohort, 'id' | 'enrolledCount'>): Promise<Cohort | null> {
    return this.request<Cohort>('/cohorts', {
      method: 'POST',
      body: JSON.stringify(cohortData),
    });
  }

  // Invoices & Sessions
  async getInvoices(): Promise<Invoice[] | null> {
    return this.request<Invoice[]>('/invoices');
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice | null> {
    return this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async getSessions(): Promise<MentorshipSession[] | null> {
    return this.request<MentorshipSession[]>('/sessions');
  }

  async createSession(sessionData: Omit<MentorshipSession, 'id' | 'sessionCode'>): Promise<MentorshipSession | null> {
    return this.request<MentorshipSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Staff & Settings
  async getStaff(): Promise<AuthUser[] | null> {
    return this.request<AuthUser[]>('/staff');
  }

  async createStaff(staffData: Omit<AuthUser, 'id'>): Promise<AuthUser | null> {
    return this.request<AuthUser>('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaff(id: string, data: Partial<AuthUser>): Promise<AuthUser | null> {
    return this.request<AuthUser>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getSettings(): Promise<OrganizationSettings | null> {
    return this.request<OrganizationSettings>('/settings');
  }

  async updateSettings(settingsData: Partial<OrganizationSettings>): Promise<OrganizationSettings | null> {
    return this.request<OrganizationSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[] | null> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  async clearNotifications() {
    return this.request('/notifications', { method: 'DELETE' });
  }

  // Backups, Restore & Production Flush
  async exportBackup() {
    return this.request<{
      version: string;
      timestamp: string;
      institution: string;
      exportedBy: string;
      data: any;
    }>('/backups/export');
  }

  async restoreBackup(backupData: any) {
    return this.request('/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ data: backupData }),
    });
  }

  async flushDemoData() {
    return this.request('/production/flush-demo-data', {
      method: 'POST',
    });
  }

  async testSmtpConnection(smtpConfig?: any) {
    return this.request<{ success: boolean; message: string; isTestAccount: boolean }>('/email/test-connection', {
      method: 'POST',
      body: JSON.stringify({ smtpConfig }),
    });
  }

  async sendEmail(payload: { to: string; subject: string; html: string; smtpConfig?: any }) {
    return this.request<{ success: boolean; messageId: string; previewUrl?: string; isTestAccount: boolean; message: string }>('/email/send-test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Staff Welcome Email & Password Setup
  async sendStaffWelcome(email: string, name: string, roleTitle: string, role?: string, html?: string) {
    return this.request<{ setupUrl: string; previewUrl?: string; isTestAccount: boolean; message: string }>('/auth/send-welcome', {
      method: 'POST',
      body: JSON.stringify({ email, name, roleTitle, role, html }),
    });
  }

  async resetPassword(email: string, password?: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Attendance & Hours Tracking
  async getAttendance(): Promise<AttendanceRecord[] | null> {
    return this.request<AttendanceRecord[]>('/attendance');
  }

  async clockIn(data: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord | null> {
    return this.request<AttendanceRecord>('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async clockOut(id: string, data: { clockOutTime: string; clockOutTimestamp: number; totalHoursWorked: number; workSummary: string }): Promise<AttendanceRecord | null> {
    return this.request<AttendanceRecord>(`/attendance/clock-out/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Nigerian Banking / NUBAN Verification
  async verifyBankAccount(payload: { bankCode: string; accountNumber: string; bankName?: string; accountName?: string }) {
    return this.request<{
      success: boolean;
      verified: boolean;
      accountName: string;
      accountNumber: string;
      bankCode: string;
      source: string;
      message: string;
    }>('/banks/verify-account', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // LMS Curriculum & Progress
  async getLMSModules(): Promise<LMSModule[] | null> {
    return this.request<LMSModule[]>('/lms/modules');
  }

  async createLMSModule(module: Partial<LMSModule>): Promise<LMSModule | null> {
    return this.request<LMSModule>('/lms/modules', {
      method: 'POST',
      body: JSON.stringify(module),
    });
  }

  async completeLesson(lessonId: string, studentId: string) {
    return this.request<{
      student: Student;
      completedLessonIds: string[];
      progressPercent: number;
    }>(`/lms/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  // LMS Assignments
  async getAssignments(): Promise<StudentAssignmentSubmission[] | null> {
    return this.request<StudentAssignmentSubmission[]>('/lms/assignments');
  }

  async submitAssignment(payload: Partial<StudentAssignmentSubmission>): Promise<StudentAssignmentSubmission | null> {
    return this.request<StudentAssignmentSubmission>('/lms/assignments/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async gradeAssignment(id: string, payload: { status: string; grade?: number; mentorFeedback?: string; reviewedBy?: string }) {
    return this.request<StudentAssignmentSubmission>(`/lms/assignments/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Student Payment Proof
  async submitProofOfPayment(studentId: string, payload: { amount: number; bankName: string; referenceNumber: string; receiptProofUrl?: string; notes?: string }) {
    return this.request(`/students/${studentId}/proof-of-payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Paystack Payment Gateway
  async initializePaystackPayment(payload: { email: string; amount: number; studentId?: string; invoiceId?: string; callbackUrl?: string; metadata?: any }) {
    return this.request<{
      authorization_url?: string;
      access_code?: string;
      reference: string;
    }>('/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyPaystackPayment(reference: string, studentId?: string, invoiceId?: string, amount?: number) {
    const query = new URLSearchParams();
    if (studentId) query.append('studentId', studentId);
    if (invoiceId) query.append('invoiceId', invoiceId);
    if (amount) query.append('amount', amount.toString());
    const qStr = query.toString() ? `?${query.toString()}` : '';

    return this.request<{
      reference: string;
      amountPaidNaira: number;
      student: Student;
      invoice: Invoice;
      commission?: any;
    }>(`/paystack/verify/${reference}${qStr}`);
  }

  async disburseMentorPayout(mentorId: string, amount: number, reason?: string) {
    return this.request<{
      mentor: Mentor;
      transferRef: string;
      disburseAmount: number;
    }>('/paystack/disburse-mentor', {
      method: 'POST',
      body: JSON.stringify({ mentorId, amount, reason }),
    });
  }

  // Mentor Session Attendance
  async markSessionAttendance(sessionId: string, payload: { status: 'Attended' | 'Absent'; hoursCredited?: number; markedBy?: string }) {
    return this.request<{ session: MentorshipSession; student?: Student }>(`/sessions/${sessionId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Student Performance & Welfare Reports
  async getStudentPerformanceReports(): Promise<StudentPerformanceReport[] | null> {
    return this.request<StudentPerformanceReport[]>('/reports/mentor-student');
  }

  async submitStudentPerformanceReport(reportData: Partial<StudentPerformanceReport>): Promise<StudentPerformanceReport | null> {
    return this.request<StudentPerformanceReport>('/reports/mentor-student', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReportFollowUpStatus(reportId: string, payload: { status: string; managementNotes?: string; reviewedBy?: string }) {
    return this.request<StudentPerformanceReport>(`/reports/mentor-student/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Certificate Issuance
  async issueStudentCertificate(studentId: string) {
    return this.request<{ student: Student; certificateNumber: string }>(`/students/${studentId}/issue-certificate`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
