import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Student } from '../../types/crm';

interface StudentWelfareInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent?: Student | null;
}

export const StudentWelfareInterventionModal: React.FC<StudentWelfareInterventionModalProps> = ({
  isOpen,
  onClose,
  targetStudent,
}) => {
  const { students, currentUser, createTicket, submitStudentPerformanceReport, showToast } = useCRM();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    targetStudent?.id || students[0]?.id || ''
  );
  const [category, setCategory] = useState<string>('Academic Distress / Missed Labs');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium'>('critical');
  const [observations, setObservations] = useState<string>('');
  const [actionsSelected, setActionsSelected] = useState<string[]>([
    'Schedule emergency counseling session with Welfare Officer',
    'Notify Academic Program Director & Executive Board',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (targetStudent) {
      setSelectedStudentId(targetStudent.id);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [targetStudent, students]);

  if (!isOpen) return null;

  const student = students.find(s => s.id === selectedStudentId) || targetStudent || students[0];

  const handleToggleAction = (action: string) => {
    setActionsSelected(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !observations.trim()) {
      showToast('Validation Error', 'Please detail your observations regarding the student welfare concern.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create High-Priority Support / Welfare Ticket in /tickets
      const ticketDescription = `
STUDENT WELFARE & AT-RISK INTERVENTION REPORT
--------------------------------------------------
Student:            ${student.name} (#${student.studentCode})
Program:            ${student.program} (${student.cohort || 'Cohort Active'})
Assigned Mentor:    ${student.mentorName || 'Faculty Pool'}
Flagged By:         ${currentUser?.name || 'Faculty Member'} (${currentUser?.roleTitle || 'Mentor'})
Date Flagged:       ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
Intervention Class: ${category}
Urgency Level:      ${priority.toUpperCase()}

FACULTY OBSERVATIONS:
${observations.trim()}

REQUESTED ACTIONS & INTERVENTIONS:
${actionsSelected.map(a => `• ${a}`).join('\n')}

CONTACT INFO:
Email: ${student.email} | Phone: ${student.phone || 'N/A'}
`.trim();

      await createTicket({
        title: `🚨 At-Risk Student Welfare: ${student.name} (${category})`,
        description: ticketDescription,
        category: 'academic_welfare' as any,
        priority: priority as any,
        status: 'open',
        assignedToRole: 'program_officer',
        createdBy: {
          id: currentUser?.id || 'usr-mentor',
          name: currentUser?.name || 'Faculty Mentor',
          email: currentUser?.email || 'mentor@codelab.institute',
          role: currentUser?.role || 'mentor',
          roleTitle: currentUser?.roleTitle || 'Faculty Lead',
        },
      });

      // 2. Automatically record an official 'At Risk' Student Performance Evaluation
      await submitStudentPerformanceReport({
        studentId: student.id,
        studentName: student.name,
        studentCode: student.studentCode || 'STU-001',
        program: student.program,
        mentorId: currentUser?.mentorId || currentUser?.id || 'men-001',
        mentorName: currentUser?.name || student.mentorName || 'Faculty Mentor',
        performanceScore: 40,
        performanceTier: 'At Risk',
        attendanceRating: 'Passive',
        technicalMasteryNotes: `At-risk alert flagged under category: ${category}.`,
        welfareObservations: observations.trim(),
        recommendations: `Dispatched welfare actions: ${actionsSelected.join('; ')}`,
        managementFollowUpStatus: 'In Progress',
      });

      showToast(
        'Welfare Alert Dispatched',
        `Intervention ticket raised and leadership notified for ${student.name}.`,
        'success'
      );

      onClose();
    } catch (err) {
      showToast('Error', 'Failed to dispatch welfare alert.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden bg-surface border border-outline-variant z-10">
        {/* Header with Urgency Alert Styling */}
        <div className="p-4 px-6 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">emergency_home</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900 dark:text-rose-100">
                Trigger Student Welfare &amp; At-Risk Early Warning
              </h3>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Immediately dispatches an urgent intervention ticket to Academic Officers and Student Counselors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs flex-1">
          {/* Student Selector */}
          <div>
            <label className="block font-bold text-secondary mb-1">Select Student Mentee *</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-outline-variant rounded-lg font-bold text-xs text-on-surface outline-none cursor-pointer focus:border-rose-500"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (#{s.studentCode}) • {s.program}
                </option>
              ))}
            </select>
          </div>

          {/* Student Snapshot Card */}
          {student && (
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-on-surface text-xs">{student.name}</span>
                <p className="text-[11px] text-secondary">
                  Cohort: <strong className="text-on-surface">{student.cohort || 'Default'}</strong> • Program: {student.program}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {student.attendanceRate}% Attendance
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                  Mentor: {student.mentorName || 'Faculty Pool'}
                </span>
              </div>
            </div>
          )}

          {/* Intervention Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-secondary mb-1">Intervention Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-3 bg-surface border border-outline-variant rounded-lg font-medium text-xs text-on-surface outline-none cursor-pointer focus:border-rose-500"
              >
                <option value="Academic Distress / Missed Labs">Academic Distress / Missed Labs</option>
                <option value="Attendance & Prolonged Absence">Attendance & Prolonged Absence</option>
                <option value="Personal Hardship / Financial Distress">Personal Hardship / Financial Distress</option>
                <option value="Health / Medical Emergency">Health / Medical Emergency</option>
                <option value="Disengagement / Non-Responsiveness">Disengagement / Non-Responsiveness</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-secondary mb-1">Urgency Priority *</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full h-9 px-3 bg-surface border border-outline-variant rounded-lg font-bold text-xs text-on-surface outline-none cursor-pointer focus:border-rose-500"
              >
                <option value="critical">🚨 Critical (Immediate Action)</option>
                <option value="high">⚠️ High Priority (Within 24 Hours)</option>
                <option value="medium">ℹ️ Medium (Routine Counseling)</option>
              </select>
            </div>
          </div>

          {/* Observations Textarea */}
          <div className="space-y-1">
            <label className="block font-bold text-secondary">
              Faculty Observations &amp; Specific Concerns *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail specific signals (e.g., student missed last 3 labs, unreached via Slack/phone, expressed severe stress with database transactions)..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-medium text-xs text-on-surface outline-none focus:border-rose-500"
            />
          </div>

          {/* Proposed Actions Checkboxes */}
          <div className="space-y-2">
            <label className="block font-bold text-secondary">Requested Welfare Interventions</label>
            <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
              {[
                'Schedule emergency counseling session with Welfare Officer',
                'Notify Academic Program Director & Executive Board',
                'Pair with dedicated peer tutor & extend lab deadline',
                'Conduct wellness home/phone check-in via Student Affairs',
                'Review tuition installment plan / emergency scholarship support',
              ].map((action, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer text-xs text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={actionsSelected.includes(action)}
                    onChange={() => handleToggleAction(action)}
                    className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>{action}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-outline-variant text-secondary hover:text-on-surface text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span>{isSubmitting ? 'Dispatching Alert...' : 'Dispatch Welfare Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
