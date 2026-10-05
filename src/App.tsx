import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
import { PWAProvider } from './context/PWAContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ExecutiveReportPage } from './pages/ExecutiveReportPage';
import { LeadManagementPage } from './pages/LeadManagementPage';
import { StudentEnrollmentPage } from './pages/StudentEnrollmentPage';
import { MentorManagementPage } from './pages/MentorManagementPage';
import { MentorAvailabilityPage } from './pages/MentorAvailabilityPage';
import { FacultyGradingPage } from './pages/FacultyGradingPage';
import { CourseOutlinePage } from './pages/CourseOutlinePage';
import { BusinessExpensesPage } from './pages/BusinessExpensesPage';
import { CoursesCohortsPage } from './pages/CoursesCohortsPage';
import { StaffAttendancePage } from './pages/StaffAttendancePage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentMentorPage } from './pages/student/StudentMentorPage';
import { StudentBillingPage } from './pages/student/StudentBillingPage';
import { TicketsPage } from './pages/TicketsPage';
import { useCRM } from './context/CRMContext';

import { ToastContainer } from './components/notifications/ToastContainer';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const HomeRoute: React.FC = () => {
  const { currentUser, hasModulePermission } = useCRM();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  if (currentUser.role === 'admissions') {
    return <Navigate to="/leads" replace />;
  }
  if (currentUser.role === 'finance') {
    return <Navigate to="/expenses" replace />;
  }
  if (currentUser.role === 'mentor') {
    return <Navigate to="/mentors" replace />;
  }
  if (currentUser.role === 'program_officer' || currentUser.role.includes('program_officer')) {
    return <Navigate to="/courses" replace />;
  }
  if (currentUser.role === 'super_admin') {
    return <ExecutiveReportPage />;
  }

  // Fallback for custom configured roles based on enabled modules
  if (hasModulePermission('reports')) return <ExecutiveReportPage />;
  if (hasModulePermission('courses')) return <Navigate to="/courses" replace />;
  if (hasModulePermission('leads')) return <Navigate to="/leads" replace />;
  if (hasModulePermission('students')) return <Navigate to="/students" replace />;
  if (hasModulePermission('mentors')) return <Navigate to="/mentors" replace />;
  if (hasModulePermission('attendance')) return <Navigate to="/attendance" replace />;
  if (hasModulePermission('expenses')) return <Navigate to="/expenses" replace />;
  if (hasModulePermission('settings')) return <Navigate to="/settings" replace />;

  return <Navigate to="/tickets" replace />;
};

export const App: React.FC = () => {
  return (
    <PWAProvider>
      <CRMProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-password" element={<ResetPasswordPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRoute />} />
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'program_officer']}>
                  <ExecutiveReportPage />
                </ProtectedRoute>
              } 
            />
            
            <Route
              path="courses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'program_officer']} requiredModule="courses">
                  <CoursesCohortsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="leads"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions']} requiredModule="leads">
                  <LeadManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="students"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance', 'program_officer']} requiredModule="students">
                  <StudentEnrollmentPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="mentors"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                  <MentorManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="mentors/office-hours"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                  <MentorAvailabilityPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="mentors/grading"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                  <FacultyGradingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="mentors/course-outlines"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer', 'admissions']} requiredModule="mentors">
                  <CourseOutlinePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="attendance"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance', 'program_officer']} requiredModule="attendance">
                  <StaffAttendancePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="expenses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'finance']} requiredModule="expenses">
                  <BusinessExpensesPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Student Portal Routes */}
            <Route
              path="student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="student/courses"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="lms">
                  <StudentCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="student/mentor"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="mentors">
                  <StudentMentorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="student/billing"
              element={
                <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                  <StudentBillingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="tickets"
              element={
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
      <PWAInstallPrompt />
      <OfflineIndicator />
    </CRMProvider>
    </PWAProvider>
  );
};

export default App;

