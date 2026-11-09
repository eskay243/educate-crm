import React, { useState, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';
import { MentorWeeklyReport, MentorLearningMaterial } from '../../types/crm';

export const MentorCurriculumPage: React.FC = () => {
  const {
    currentUser,
    mentors,
    courses,
    updateMentor,
    showToast,
  } = useCRM();

  // Find active mentor
  const myMentor = useMemo(() => {
    return (
      mentors.find(
        m => m.id === currentUser?.mentorId || m.name === currentUser?.name || m.email === currentUser?.email
      ) || mentors[0]
    );
  }, [mentors, currentUser]);

  const [activeTab, setActiveTab] = useState<'courses' | 'materials' | 'reports'>('courses');

  // Modal states for Weekly Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportWeek, setReportWeek] = useState<number>(1);
  const [reportCourse, setReportCourse] = useState('');
  const [reportTopicsCovered, setReportTopicsCovered] = useState('');
  const [reportChallenges, setReportChallenges] = useState('');
  const [reportEngagement, setReportEngagement] = useState<'High' | 'Medium' | 'Low'>('High');

  // Modal states for Learning Material
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'Slide' | 'Document' | 'Code' | 'Video'>('Slide');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialCourse, setMaterialCourse] = useState('');

  // Assigned courses for this mentor
  const myCourses = useMemo(() => {
    if (!myMentor) return courses;
    return courses.filter(c => {
      const isLead = c.leadInstructor?.toLowerCase() === myMentor.name?.toLowerCase();
      const isAssigned = c.assignedMentors?.some(
        am => am.mentorId === myMentor.id || am.mentorName?.toLowerCase() === myMentor.name?.toLowerCase()
      );
      return isLead || isAssigned;
    });
  }, [courses, myMentor]);

  // Selected course for syllabus inspect
  const [selectedCourseId, setSelectedCourseId] = useState<string>(myCourses[0]?.id || '');
  const activeCourse = useMemo(() => {
    return myCourses.find(c => c.id === selectedCourseId) || myCourses[0];
  }, [myCourses, selectedCourseId]);

  // Handlers
  const handleSaveWeeklyReport = () => {
    if (!reportCourse || !reportTopicsCovered.trim()) {
      showToast('Validation Error', 'Please select a course and enter topics covered.', 'error');
      return;
    }

    const newReport: MentorWeeklyReport = {
      id: `rep-${Date.now()}`,
      mentorId: myMentor.id,
      weekEnding: new Date().toISOString().split('T')[0],
      learnersCoveredCount: 15,
      sessionsHeldCount: 4,
      topicsCovered: [reportTopicsCovered.trim()],
      keyHighlights: `Week ${reportWeek}: ${reportCourse}`,
      challengesEncountered: reportChallenges.trim(),
      actionItemsNextWeek: 'Complete subsequent syllabus modules and review assignments.',
      submittedAt: new Date().toISOString(),
    };

    const existingReports = myMentor.weeklyReports || [];
    const updated = [newReport, ...existingReports];

    updateMentor(myMentor.id, { weeklyReports: updated });
    showToast('Weekly Report Submitted', `Week ${reportWeek} report filed successfully.`, 'success');
    setIsReportModalOpen(false);
    setReportTopicsCovered('');
    setReportChallenges('');
  };

  const handleSaveLearningMaterial = () => {
    if (!materialTitle.trim() || !materialUrl.trim()) {
      showToast('Validation Error', 'Please provide a title and valid URL.', 'error');
      return;
    }

    const resType =
      materialType === 'Slide'
        ? ('slides' as const)
        : materialType === 'Document'
        ? ('pdf' as const)
        : materialType === 'Code'
        ? ('github_repo' as const)
        : ('video' as const);

    const newMaterial: MentorLearningMaterial = {
      id: `mat-${Date.now()}`,
      mentorId: myMentor.id,
      title: materialTitle.trim(),
      track: materialCourse || activeCourse?.title || 'General',
      moduleName: 'General',
      resourceType: resType,
      url: materialUrl.trim(),
      uploadedAt: new Date().toISOString(),
      isPublicToLearners: true,
    };

    const existing = myMentor.learningMaterials || [];
    const updated = [newMaterial, ...existing];

    updateMentor(myMentor.id, { learningMaterials: updated });
    showToast('Resource Added', 'Learning material published for learners.', 'success');
    setIsMaterialModalOpen(false);
    setMaterialTitle('');
    setMaterialUrl('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Curriculum, Syllabi &amp; Teaching Hub</h1>
          <p className="text-secondary text-xs md:text-sm mt-0.5">
            Inspect official course syllabi, share lecture slides, and file mandatory weekly faculty teaching reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setReportCourse(activeCourse?.title || '');
              setIsReportModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">post_add</span>
            <span>Submit Weekly Report</span>
          </button>
          <button
            onClick={() => {
              setMaterialCourse(activeCourse?.title || '');
              setIsMaterialModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-on-surface flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          <span>Assigned Syllabi ({myCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">folder</span>
          <span>Learning Materials ({myMentor?.learningMaterials?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-primary text-white shadow-xs'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">assessment</span>
          <span>Weekly Teaching Reports ({myMentor?.weeklyReports?.length || 0})</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Selection List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">Your Assigned Courses</h2>
            {myCourses.map(course => {
              const isSelected = (activeCourse?.id === course.id);
              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-xs'
                      : 'bg-surface border-outline-variant hover:border-primary/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-secondary">
                      {course.code}
                    </span>
                    <span className="text-xs font-bold text-primary">{course.durationWeeks} Weeks</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mt-2">{course.title}</h3>
                  <p className="text-xs text-secondary mt-1">{course.category}</p>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Syllabus & Modules */}
          <div className="lg:col-span-2">
            {activeCourse ? (
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-white">
                        {activeCourse.code}
                      </span>
                      <h2 className="text-lg font-bold text-on-surface">{activeCourse.title}</h2>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      {activeCourse.description || 'Comprehensive curriculum program designed for technical mastery.'}
                    </p>
                  </div>

                  {activeCourse.curriculumDriveUrl && (
                    <a
                      href={activeCourse.curriculumDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-lg bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-primary flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">cloud_download</span>
                      <span>Google Drive Syllabus</span>
                    </a>
                  )}
                </div>

                {/* Academic Structure Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase font-semibold">Duration</span>
                    <p className="text-sm font-bold text-on-surface mt-0.5">{activeCourse.durationWeeks} Weeks</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase font-semibold">Theory vs Lab</span>
                    <p className="text-sm font-bold text-on-surface mt-0.5">30% Theory / 70% Lab</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase font-semibold">Min Required</span>
                    <p className="text-sm font-bold text-on-surface mt-0.5">{activeCourse.minimumRequiredHours || 20} Hours</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase font-semibold">NSQF Track</span>
                    <p className="text-sm font-bold text-on-surface mt-0.5">Level 4 Standard</p>
                  </div>
                </div>

                {/* Syllabus Modules */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">format_list_bulleted</span>
                    <span>Curriculum Syllabus Modules</span>
                  </h3>

                  <div className="space-y-2">
                    {(activeCourse.syllabusModules || [
                      'Module 1: Orientation & Technical Prerequisites',
                      'Module 2: Core Concepts & Architectural Patterns',
                      'Module 3: Hands-on Practical Projects & Labs',
                      'Module 4: Capstone Project & Production Deployment'
                    ]).map((mod, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-xs font-semibold text-on-surface">{mod}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-secondary border border-dashed rounded-xl">
                Select a course on the left to view its curriculum outline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {(myMentor?.learningMaterials || []).length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-outline-variant rounded-2xl bg-surface">
              <span className="material-symbols-outlined text-[40px] text-secondary/40">cloud_upload</span>
              <p className="text-base font-bold text-on-surface mt-2">No Learning Materials Added Yet</p>
              <p className="text-xs text-secondary mt-1">Upload lesson slide decks, code sandboxes, or notes for your learners.</p>
              <button
                onClick={() => setIsMaterialModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add First Material</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(myMentor?.learningMaterials || []).map(mat => (
                <div key={mat.id} className="p-4 rounded-xl bg-surface border border-outline-variant shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                        {mat.resourceType}
                      </span>
                      <span className="text-[10px] text-secondary">{new Date(mat.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface mt-2">{mat.title}</h4>
                    <p className="text-xs text-secondary mt-1">{mat.track}</p>
                  </div>
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 h-8 px-3 rounded-lg bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-primary flex items-center justify-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    <span>Access Resource</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {(myMentor?.weeklyReports || []).length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-outline-variant rounded-2xl bg-surface">
              <span className="material-symbols-outlined text-[40px] text-secondary/40">assignment</span>
              <p className="text-base font-bold text-on-surface mt-2">No Weekly Teaching Reports Filed</p>
              <p className="text-xs text-secondary mt-1">Submit your weekly instructional logs and student engagement summaries.</p>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">post_add</span>
                <span>Submit Week 1 Report</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(myMentor?.weeklyReports || []).map(rep => (
                <div key={rep.id} className="p-5 rounded-2xl bg-surface border border-outline-variant shadow-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary text-white font-bold text-xs">
                        Report
                      </span>
                      <h4 className="text-sm font-bold text-on-surface">{rep.keyHighlights || 'Weekly Instruction Report'}</h4>
                    </div>
                    <span className="text-xs text-secondary">{new Date(rep.submittedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-secondary">Topics Covered:</span>
                      <p className="text-on-surface mt-0.5">{Array.isArray(rep.topicsCovered) ? rep.topicsCovered.join(', ') : rep.topicsCovered}</p>
                    </div>

                    {rep.challengesEncountered && (
                      <div>
                        <span className="font-semibold text-secondary">Challenges Encountered:</span>
                        <p className="text-amber-700 mt-0.5">{rep.challengesEncountered}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-secondary">
                      <span>Week Ending:</span>
                      <span className="font-bold text-on-surface">{rep.weekEnding}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface">File Weekly Faculty Teaching Report</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Week Number *</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={reportWeek}
                    onChange={e => setReportWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Course *</label>
                  <select
                    value={reportCourse}
                    onChange={e => setReportCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  >
                    <option value="">Select Course</option>
                    {myCourses.map(c => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Topics &amp; Practical Labs Covered *</label>
                <textarea
                  value={reportTopicsCovered}
                  onChange={e => setReportTopicsCovered(e.target.value)}
                  placeholder="Outline modules taught and practical exercises completed this week..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Observations &amp; Challenges Encountered</label>
                <textarea
                  value={reportChallenges}
                  onChange={e => setReportChallenges(e.target.value)}
                  placeholder="Any student bottlenecks, internet/power issues, or concepts needing review..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Cohort Engagement Level</label>
                <select
                  value={reportEngagement}
                  onChange={e => setReportEngagement(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                >
                  <option value="High">High - Active participation &amp; submissions</option>
                  <option value="Medium">Medium - Satisfactory progress</option>
                  <option value="Low">Low - Needs program officer intervention</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-secondary hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeeklyReport}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all shadow-xs"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Material Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface">Publish Learning Resource</h3>
              <button onClick={() => setIsMaterialModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Resource Title *</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={e => setMaterialTitle(e.target.value)}
                  placeholder="e.g. Week 3 System Architecture Slides"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Resource Type</label>
                  <select
                    value={materialType}
                    onChange={e => setMaterialType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  >
                    <option value="Slide">Slide Deck</option>
                    <option value="Document">PDF / Document</option>
                    <option value="Code">GitHub Repository</option>
                    <option value="Video">Recorded Lecture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Course</label>
                  <select
                    value={materialCourse}
                    onChange={e => setMaterialCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                  >
                    {myCourses.map(c => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Resource URL (Drive, GitHub, Figma) *</label>
                <input
                  type="url"
                  value={materialUrl}
                  onChange={e => setMaterialUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
              <button
                onClick={() => setIsMaterialModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-xs font-bold text-secondary hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLearningMaterial}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all shadow-xs"
              >
                Publish Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
