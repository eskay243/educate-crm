import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useCRM } from '../../context/CRMContext';
import { CreateRecordHubModal } from '../modals/CreateRecordHubModal';
import { RecruitMentorModal } from '../modals/RecruitMentorModal';
import { EnrollStudentModal } from '../modals/EnrollStudentModal';
import { AddLeadModal } from '../modals/AddLeadModal';
import { LogExpenseModal } from '../modals/LogExpenseModal';
import { ExportReportModal } from '../modals/ExportReportModal';
import { InvoiceModal } from '../modals/InvoiceModal';
import { BookSessionModal } from '../modals/BookSessionModal';
import { CreateCohortModal } from '../modals/CreateCohortModal';
import { CreateCourseModal } from '../modals/CreateCourseModal';
import { EditCourseModal } from '../modals/EditCourseModal';
import { AssignMentorModal } from '../modals/AssignMentorModal';
import { EditMentorModal } from '../modals/EditMentorModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';

export const AppLayout: React.FC = () => {
  const { activeModal, closeModal } = useCRM();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-body-md">
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden md:flex md:w-64 md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-surface-container-low shadow-2xl">
            <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <TopNavbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-container-max mx-auto p-4 sm:p-gutter md:p-margin-page pb-16">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CreateRecordHubModal 
        isOpen={activeModal === 'create-hub'} 
        onClose={closeModal} 
      />
      <RecruitMentorModal 
        isOpen={activeModal === 'recruit-mentor'} 
        onClose={closeModal} 
      />
      <EnrollStudentModal 
        isOpen={activeModal === 'enroll-student'} 
        onClose={closeModal} 
      />
      <AddLeadModal 
        isOpen={activeModal === 'add-lead'} 
        onClose={closeModal} 
      />
      <LogExpenseModal 
        isOpen={activeModal === 'log-expense'} 
        onClose={closeModal} 
      />
      <ExportReportModal 
        isOpen={activeModal === 'export-report'} 
        onClose={closeModal} 
      />
      <InvoiceModal
        isOpen={activeModal === 'view-invoice'}
        onClose={closeModal}
      />
      <BookSessionModal
        isOpen={activeModal === 'book-session'}
        onClose={closeModal}
      />
      <CreateCohortModal
        isOpen={activeModal === 'create-cohort'}
        onClose={closeModal}
      />
      <CreateCourseModal
        isOpen={activeModal === 'create-course'}
        onClose={closeModal}
      />
      <EditCourseModal
        isOpen={activeModal === 'edit-course'}
        onClose={closeModal}
      />
      <AssignMentorModal
        isOpen={activeModal === 'assign-mentor'}
        onClose={closeModal}
      />
      <EditMentorModal
        isOpen={activeModal === 'edit-mentor'}
        onClose={closeModal}
      />
      <ChangePasswordModal />
    </div>
  );
};
