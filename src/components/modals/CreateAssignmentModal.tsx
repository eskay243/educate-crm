import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseTitle?: string;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  defaultCourseTitle,
}) => {
  const {
    currentUser,
    mentors,
    courses,
    students,
    createAssignment,
    showToast,
  } = useCRM();

  const isMentor = currentUser?.role === 'mentor';

  const myMentorProfile = useMemo(() => {
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || norm(m.name) === norm(currentUser?.name) || m.email?.toLowerCase() === currentUser?.email?.toLowerCase()
      ) || (isMentor ? mentors[0] : null)
    );
  }, [mentors, currentUser, isMentor]);

  // Mentor's courses
  const accessibleCourses = useMemo(() => {
    if (!isMentor || !myMentorProfile) return courses;
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const myName = norm(myMentorProfile.name);
    const filtered = courses.filter(c => {
      const isLead = norm(c.leadInstructor) === myName;
      const isAssigned = c.assignedMentors?.some(
        am => am.mentorId === myMentorProfile.id || norm(am.mentorName) === myName
      );
      return isLead || isAssigned;
    });
    return filtered.length > 0 ? filtered : courses;
  }, [courses, isMentor, myMentorProfile]);

  // Mentor's students
  const accessibleStudents = useMemo(() => {
    if (!isMentor || !myMentorProfile) return students;
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const myName = norm(myMentorProfile.name);
    return students.filter(s => (s.mentorId && s.mentorId === myMentorProfile.id) || norm(s.mentorName) === myName);
  }, [students, isMentor, myMentorProfile]);

  const [courseTitle, setCourseTitle] = useState<string>(defaultCourseTitle || accessibleCourses[0]?.title || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('Module 1: Applied Project Deliverable');
  const [assignmentType, setAssignmentType] = useState<'assignment' | 'capstone_project' | 'lab'>('assignment');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [maxScore, setMaxScore] = useState<number>(100);
  const [instructions, setInstructions] = useState('');
  
  // Direct grading
  const [gradeDirectly, setGradeDirectly] = useState(false);
  const [directGrade, setDirectGrade] = useState<number>(85);
  const [directStatus, setDirectStatus] = useState<'Passed' | 'Exceptional' | 'Needs Revision'>('Passed');
  const [directFeedback, setDirectFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !courseTitle) {
      showToast('Validation Error', 'Please enter an assignment title and select a course.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedStudentId === 'all') {
        // Create for all accessible students or generic
        const targetStudents = accessibleStudents.filter(s => {
          if (!courseTitle) return true;
          return s.program?.toLowerCase().includes(courseTitle.toLowerCase()) || 
                 s.courses?.some(c => c.name?.toLowerCase().includes(courseTitle.toLowerCase()));
        });

        const recipients = targetStudents.length > 0 ? targetStudents : (accessibleStudents.length > 0 ? accessibleStudents : [{ id: '', name: 'All Enrolled Scholars' }]);

        for (const st of recipients) {
          await createAssignment({
            taskTitle: taskTitle.trim(),
            courseTitle,
            moduleTitle: moduleTitle.trim(),
            mentorId: myMentorProfile?.id,
            mentorName: myMentorProfile?.name || currentUser?.name,
            studentId: st.id || undefined,
            studentName: st.name || undefined,
            instructions: instructions.trim(),
            maxScore: Number(maxScore) || 100,
            dueDate,
            assignmentType,
            grade: gradeDirectly ? directGrade : undefined,
            status: gradeDirectly ? directStatus : 'Pending',
            mentorFeedback: gradeDirectly ? directFeedback.trim() : undefined,
          });
        }
      } else {
        const student = accessibleStudents.find(s => s.id === selectedStudentId);
        await createAssignment({
          taskTitle: taskTitle.trim(),
          courseTitle,
          moduleTitle: moduleTitle.trim(),
          mentorId: myMentorProfile?.id,
          mentorName: myMentorProfile?.name || currentUser?.name,
          studentId: student?.id,
          studentName: student?.name,
          instructions: instructions.trim(),
          maxScore: Number(maxScore) || 100,
          dueDate,
          assignmentType,
          grade: gradeDirectly ? directGrade : undefined,
          status: gradeDirectly ? directStatus : 'Pending',
          mentorFeedback: gradeDirectly ? directFeedback.trim() : undefined,
        });
      }

      onClose();
    } catch (err: any) {
      showToast('Creation Failed', err.message || 'Could not create assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="my-auto relative w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">assignment_add</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Create &amp; Grade Assignment
              </h3>
              <p className="text-xs text-secondary">
                Assign coursework, lab deliverables, or defend capstone projects with immediate scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-xs">
            {/* Course & Type Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Course Track *
                </label>
                <select
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  {accessibleCourses.map(c => (
                    <option key={c.id} value={c.title}>
                      {c.title} ({c.code || 'Track'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Task Category *
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="assignment">Standard Lab Assignment</option>
                  <option value="capstone_project">Capstone Defense Project</option>
                  <option value="lab">Sprint Code Review</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Assignment / Project Title *
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. End-to-End ETL Pipeline & Analytics Dashboard Defense"
                required
                className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none font-semibold"
              />
            </div>

            {/* Module & Target Student */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Curriculum Module / Milestone
                </label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Module 2: Data Engineering"
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Target Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant font-semibold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Assigned Cohort Students ({accessibleStudents.length})</option>
                  {accessibleStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Max Score */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Maximum Points / Score
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Instructions &amp; Rubric Criteria
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specify requirements, repository deliverables, test suites, or live demo URLs required..."
                rows={3}
                className="w-full p-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Direct Grade Toggle Section */}
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={gradeDirectly}
                  onChange={(e) => setGradeDirectly(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-outline-variant cursor-pointer"
                />
                <span className="font-bold text-on-surface text-xs">
                  Directly Enter &amp; Publish Score Now (Immediate Defense Evaluation)
                </span>
              </label>

              {gradeDirectly && (
                <div className="space-y-3 pt-2 border-t border-outline-variant/60 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">
                        Awarded Score (0 - {maxScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={directGrade}
                        onChange={(e) => setDirectGrade(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-surface border border-outline-variant text-xs font-bold font-mono text-on-surface focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">
                        Outcome Verdict
                      </label>
                      <select
                        value={directStatus}
                        onChange={(e) => setDirectStatus(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-on-surface focus:border-primary focus:outline-none cursor-pointer"
                      >
                        <option value="Passed">Passed (Meets Standard)</option>
                        <option value="Exceptional">Exceptional (Exceeds Target)</option>
                        <option value="Needs Revision">Needs Revision (Resubmit)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Faculty Critique &amp; Constructive Rubric Feedback
                    </label>
                    <textarea
                      value={directFeedback}
                      onChange={(e) => setDirectFeedback(e.target.value)}
                      placeholder="Add specific comments on architecture, code quality, and capstone defense performance..."
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !taskTitle.trim()}
              className="px-6 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Assignment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">
                    {gradeDirectly ? 'verified' : 'send'}
                  </span>
                  <span>{gradeDirectly ? 'Save & Publish Score' : 'Publish Assignment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
