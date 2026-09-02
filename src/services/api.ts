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
  ExpenseStatus
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

  async updateExpenseStatus(id: string, status: ExpenseStatus): Promise<Expense | null> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
}

export const apiService = new ApiService();
