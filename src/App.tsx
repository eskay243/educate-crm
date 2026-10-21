import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
import { PWAProvider } from './context/PWAContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useCRM } from './context/CRMContext';

import { ToastContainer } from './components/notifications/ToastContainer';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Code-split page components for high-speed initial bundle download
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ExecutiveReportPage = lazy(() => import('./pages/ExecutiveReportPage').then(m => ({ default: m.ExecutiveReportPage })));
const LeadManagementPage = lazy(() => import('./pages/LeadManagementPage').then(m => ({ default: m.LeadManagementPage })));
const StudentEnrollmentPage = lazy(() => import('./pages/StudentEnrollmentPage').then(m => ({ default: m.StudentEnrollmentPage })));
const MentorManagementPage = lazy(() => import('./pages/MentorManagementPage').then(m => ({ default: m.MentorManagementPage })));
const MentorAvailabilityPage = lazy(() => import('./pages/MentorAvailabilityPage').then(m => ({ default: m.MentorAvailabilityPage })));
const FacultyGradingPage = lazy(() => import('./pages/FacultyGradingPage').then(m => ({ default: m.FacultyGradingPage })));
const CourseOutlinePage = lazy(() => import('./pages/CourseOutlinePage').then(m => ({ default: m.CourseOutlinePage })));
const BusinessExpensesPage = lazy(() => import('./pages/BusinessExpensesPage').then(m => ({ default: m.BusinessExpensesPage })));
const CoursesCohortsPage = lazy(() => import('./pages/CoursesCohortsPage').then(m => ({ default: m.CoursesCohortsPage })));
const StaffAttendancePage = lazy(() => import('./pages/StaffAttendancePage').then(m => ({ default: m.StaffAttendancePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage').then(m => ({ default: m.StudentDashboardPage })));
const StudentCoursesPage = lazy(() => import('./pages/student/StudentCoursesPage').then(m => ({ default: m.StudentCoursesPage })));
const StudentMentorPage = lazy(() => import('./pages/student/StudentMentorPage').then(m => ({ default: m.StudentMentorPage })));
const StudentBillingPage = lazy(() => import('./pages/student/StudentBillingPage').then(m => ({ default: m.StudentBillingPage })));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then(m => ({ default: m.TicketsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loading Module...</span>
    </div>
  </div>
);

const HomeRoute: React.FC = () => {
  const { currentUser, hasModulePermission, isModuleEnabled } = useCRM();
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
  if (hasModulePermission('reports') && isModuleEnabled('reports')) return <ExecutiveReportPage />;
  if (hasModulePermission('courses') && isModuleEnabled('courses')) return <Navigate to="/courses" replace />;
  if (hasModulePermission('leads') && isModuleEnabled('leads')) return <Navigate to="/leads" replace />;
  if (hasModulePermission('students') && isModuleEnabled('students')) return <Navigate to="/students" replace />;
  if (hasModulePermission('mentors') && isModuleEnabled('mentors')) return <Navigate to="/mentors" replace />;
  if (hasModulePermission('attendance') && isModuleEnabled('attendance')) return <Navigate to="/attendance" replace />;
  if (hasModulePermission('expenses') && isModuleEnabled('expenses')) return <Navigate to="/expenses" replace />;
  if (hasModulePermission('settings')) return <Navigate to="/settings" replace />;

  if (isModuleEnabled('tickets')) return <Navigate to="/tickets" replace />;
  return <Navigate to="/settings" replace />;
};

export const App: React.FC = () => {
  return (
    <PWAProvider>
      <CRMProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
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
                    <ProtectedRoute allowedRoles={['super_admin', 'program_officer']} requiredModule="reports">
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
                    <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="billing">
                      <StudentBillingPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="tickets"
                  element={
                    <ProtectedRoute requiredModule="tickets">
                      <TicketsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <ToastContainer />
        <PWAInstallPrompt />
        <OfflineIndicator />
      </CRMProvider>
    </PWAProvider>
  );
};

export default App;

