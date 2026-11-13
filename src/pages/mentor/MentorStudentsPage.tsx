import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../../context/CRMContext';
import { Student, StudentGoal } from '../../types/crm';
import { StudentWelfareInterventionModal } from '../../components/modals/StudentWelfareInterventionModal';

export const MentorStudentsPage: React.FC = () => {
  const {
    currentUser,
    mentors,
    students,
    openModal,
    setSelectedStudentId,
    setSelectedMentorForBookingId,
    showToast,
    updateStudent,
  } = useCRM();

  const navigate = useNavigate();

  // Find active mentor profile
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'At Risk'>('All');
  const [selectedCohort, setSelectedCohort] = useState<string>('All');

  // Modal states for Student Welfare and Goals
  const [welfareStudent, setWelfareStudent] = useState<Student | null>(null);
  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);

  // Goal modal state
  const [goalStudent, setGoalStudent] = useState<Student | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newGoalNotes, setNewGoalNotes] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Assigned students filter (matching by mentorId or trimmed name)
  const assignedStudents = useMemo(() => {
    if (!myMentor) return [];
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const myName = norm(myMentor.name);
    return students.filter(
      s => (s.mentorId && s.mentorId === myMentor.id) || norm(s.mentorName) === myName
    );
  }, [students, myMentor]);

  // Unique cohorts for filtering
  const availableCohorts = useMemo(() => {
    const set = new Set<string>();
    assignedStudents.forEach(s => {
      if (s.cohort) set.add(s.cohort);
    });
    return Array.from(set);
  }, [assignedStudents]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return assignedStudents.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCohort = selectedCohort === 'All' || s.cohort === selectedCohort;

      const isAtRisk = s.attendanceRate < 75 || s.performanceTier === 'At Risk' || s.performanceTier === 'Needs Support';
      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'At Risk'
          ? isAtRisk
          : s.status === 'Active';

      return matchSearch && matchCohort && matchStatus;
    });
  }, [assignedStudents, searchTerm, selectedCohort, statusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = assignedStudents.length;
    const atRisk = assignedStudents.filter(
      s => s.attendanceRate < 75 || s.performanceTier === 'At Risk' || s.performanceTier === 'Needs Support'
    ).length;
    const avgAttendance = total > 0 ? Math.round(assignedStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / total) : 0;
    return { total, atRisk, avgAttendance };
  }, [assignedStudents]);

  // Handlers
  const handleOpenStudentProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    openModal('student-profile');
  };

  const handleBookSessionWithStudent = () => {
    setSelectedMentorForBookingId(myMentor?.id || null);
    openModal('book-session');
  };

  const handleOpenWelfareModal = (student: Student) => {
    setWelfareStudent(student);
    setIsWelfareModalOpen(true);
  };

  const handleOpenGoalModal = (student: Student) => {
    setGoalStudent(student);
    setNewGoalTitle('');
    setNewGoalTargetDate('');
    setNewGoalNotes('');
    setIsGoalModalOpen(true);
  };

  const handleAddGoal = () => {
    if (!goalStudent || !newGoalTitle.trim()) {
      showToast('Validation Error', 'Please enter a goal description.', 'error');
      return;
    }

    const newGoal: StudentGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: 'Technical',
      targetDate: newGoalTargetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      mentorNotes: newGoalNotes.trim() ? `${newGoalNotes.trim()} (Set with ${myMentor?.name})` : `Set with mentor ${myMentor?.name}`,
    };

    const updatedGoals = [...(goalStudent.mentorGoals || []), newGoal];

    updateStudent(goalStudent.id, { mentorGoals: updatedGoals });
    showToast('Goal Established', `Academic milestone added for ${goalStudent.name}.`, 'success');
    setIsGoalModalOpen(false);
  };

  const handleToggleGoalStatus = (student: Student, goalId: string) => {
    const existingGoals = student.mentorGoals || [];
    const updated = existingGoals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          status: g.status === 'Achieved' ? ('In Progress' as const) : ('Achieved' as const),
          achievedAt: g.status === 'Achieved' ? undefined : new Date().toISOString(),
        };
      }
      return g;
    });

    updateStudent(student.id, { mentorGoals: updated });
    showToast('Goal Updated', 'Goal milestone status updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Assigned Learners &amp; Student Care</h1>
          <p className="text-secondary text-xs md:text-sm mt-0.5">
            Track student learning progress, monitor attendance health, establish goals, and initiate welfare interventions.
          </p>
        </div>

        {/* Aggregate Health Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-surface border border-outline-variant rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">group</span>
            <div>
              <p className="text-[10px] text-secondary font-medium uppercase">My Learners</p>
              <p className="text-sm font-bold text-on-surface">{stats.total} Enrolled</p>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">trending_up</span>
            <div>
              <p className="text-[10px] text-secondary font-medium uppercase">Avg Attendance</p>
              <p className="text-sm font-bold text-emerald-700">{stats.avgAttendance}%</p>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-amber-600 text-[18px]">emergency</span>
            <div>
              <p className="text-[10px] text-secondary font-medium uppercase">At-Risk Watch</p>
              <p className="text-sm font-bold text-amber-600">{stats.atRisk} Flagged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search learners by name, matric code, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cohort Selector */}
          <select
            value={selectedCohort}
            onChange={e => setSelectedCohort(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="All">All Cohorts</option>
            {availableCohorts.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex rounded-lg border border-outline-variant overflow-hidden p-0.5 bg-surface-container-lowest">
            {(['All', 'Active', 'At Risk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  statusFilter === tab
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Learners Directory Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-outline-variant rounded-2xl bg-surface">
          <span className="material-symbols-outlined text-[40px] text-secondary/40">school</span>
          <p className="text-base font-bold text-on-surface mt-2">No Assigned Learners Found</p>
          <p className="text-xs text-secondary mt-1">
            {searchTerm || selectedCohort !== 'All'
              ? 'Try modifying your search or cohort filter.'
              : 'You currently have no learners assigned under your mentorship.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map(student => {
            const isAtRisk =
              student.attendanceRate < 75 ||
              student.performanceTier === 'At Risk' ||
              student.performanceTier === 'Needs Support';

            const activeGoals = student.mentorGoals?.filter(g => g.status === 'In Progress') || [];

            return (
              <div
                key={student.id}
                className={`bg-surface border rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm flex flex-col justify-between ${
                  isAtRisk ? 'border-amber-300 ring-1 ring-amber-100' : 'border-outline-variant'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={student.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-outline-variant"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-on-surface hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenStudentProfile(student.id)}>
                          {student.name}
                        </h3>
                        <p className="text-[11px] text-secondary font-mono">{student.studentCode}</p>
                        <p className="text-[11px] text-secondary mt-0.5">{student.cohort || 'Regular Cohort'}</p>
                      </div>
                    </div>

                    {isAtRisk ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        At Risk
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        On Track
                      </span>
                    )}
                  </div>

                  {/* Program and Metrics */}
                  <div className="mt-4 pt-3 border-t border-outline-variant space-y-2.5">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">Program Track</span>
                      <p className="text-xs font-semibold text-on-surface truncate">{student.program}</p>
                    </div>

                    {/* Attendance and Progress Indicators */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
                        <div className="flex justify-between items-center text-[10px] text-secondary">
                          <span>Attendance</span>
                          <span className={`font-bold ${student.attendanceRate < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {student.attendanceRate}%
                          </span>
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${student.attendanceRate < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, student.attendanceRate)}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
                        <div className="flex justify-between items-center text-[10px] text-secondary">
                          <span>Syllabus</span>
                          <span className="font-bold text-primary">{student.progressPercent || 0}%</span>
                        </div>
                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, student.progressPercent || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Goals Preview */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-secondary font-medium">Active Milestones:</span>
                        <span className="font-bold text-on-surface">{activeGoals.length} Set</span>
                      </div>
                      {activeGoals.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {activeGoals.slice(0, 2).map(goal => (
                            <div
                              key={goal.id}
                              onClick={() => handleToggleGoalStatus(student, goal.id)}
                              className="text-[11px] p-1.5 rounded bg-surface-container border border-outline-variant hover:border-primary flex items-center justify-between cursor-pointer transition-colors"
                              title="Click to toggle completion"
                            >
                              <span className="truncate max-w-[200px] text-on-surface">{goal.title}</span>
                              <span className="material-symbols-outlined text-[14px] text-secondary">check_box_outline_blank</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenGoalModal(student)}
                    className="h-8 px-2 rounded-lg bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-primary text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Set Goal"
                  >
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    <span>Goal</span>
                  </button>

                  <button
                    onClick={() => handleBookSessionWithStudent()}
                    className="h-8 px-2 rounded-lg bg-surface border border-outline-variant hover:border-primary text-secondary hover:text-primary text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Schedule Session"
                  >
                    <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                    <span>1-on-1</span>
                  </button>

                  <button
                    onClick={() => handleOpenWelfareModal(student)}
                    className="h-8 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="File Welfare or Academic Intervention"
                  >
                    <span className="material-symbols-outlined text-[14px]">emergency</span>
                    <span>Welfare</span>
                  </button>

                  <button
                    onClick={() => navigate('/chat')}
                    className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Direct Chat"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Welfare Intervention Modal */}
      {welfareStudent && (
        <StudentWelfareInterventionModal
          isOpen={isWelfareModalOpen}
          onClose={() => setIsWelfareModalOpen(false)}
          targetStudent={welfareStudent}
        />
      )}

      {/* Goal Setting Modal */}
      {isGoalModalOpen && goalStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">flag</span>
                <h3 className="text-base font-bold text-on-surface">Set Goal for {goalStudent.name}</h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Milestone / Goal Title *</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Complete React Component Lifecycle Lab"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={e => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Mentorship Action Notes</label>
                <textarea
                  value={newGoalNotes}
                  onChange={e => setNewGoalNotes(e.target.value)}
                  placeholder="Specific instructions or key deliverables to review in next coaching call..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-secondary hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-xs"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
