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
  const { currentUser } = useCRM();
  if (currentUser?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <ExecutiveReportPage />;
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
            <Route path="reports" element={<HomeRoute />} />
            
            <Route
              path="courses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions']} requiredModule="courses">
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
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance']} requiredModule="students">
                  <StudentEnrollmentPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="mentors"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor']} requiredModule="mentors">
                  <MentorManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="attendance"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance']} requiredModule="attendance">
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
                <ProtectedRoute allowedRoles={['super_admin']}>
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

