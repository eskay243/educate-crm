import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
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
import { SettingsPage } from './pages/SettingsPage';

import { ToastContainer } from './components/notifications/ToastContainer';

export const App: React.FC = () => {
  return (
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
            <Route index element={<ExecutiveReportPage />} />
            <Route path="reports" element={<ExecutiveReportPage />} />
            
            <Route
              path="courses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions']}>
                  <CoursesCohortsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="leads"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions']}>
                  <LeadManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="students"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance']}>
                  <StudentEnrollmentPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="mentors"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'mentor']}>
                  <MentorManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="expenses"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'finance']}>
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
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </CRMProvider>
  );
};

export default App;

