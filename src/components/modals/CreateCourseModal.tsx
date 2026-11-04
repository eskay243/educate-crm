import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';
import { CourseMentorShare } from '../../types/crm';

export interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose }) => {
  const { activeMentors, addCourse, settings, addCourseCategory } = useCRM();

  const categoriesList = settings.courseCategories || [
    'Software Engineering',
    'Data Science & Analytics',
    'Product Design (UI/UX)',
    'Cloud Engineering & DevOps',
    'Cybersecurity & Information Security',
    'Product Management',
    'Artificial Intelligence & Machine Learning',
    'Digital Marketing & Growth',
  ];

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(categoriesList[0] || 'Software Engineering');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [tuitionFee, setTuitionFee] = useState(850000);
  const [leadInstructor, setLeadInstructor] = useState(activeMentors[0]?.name || 'General Faculty');
  const [assignedMentors, setAssignedMentors] = useState<CourseMentorShare[]>([
    {
      mentorId: activeMentors[0]?.id || 'm-1',
      mentorName: activeMentors[0]?.name || 'General Faculty',
      sharePercentage: 100,
      role: 'Lead Instructor'
    }
  ]);
  const [modules, setModules] = useState<string[]>([
    'Core Foundational Architecture',
    'Applied Industry Capstone & System Design',
  ]);
  const [newModuleText, setNewModuleText] = useState('');
  const [curriculumDriveUrl, setCurriculumDriveUrl] = useState('');

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      addCourseCategory(trimmed);
      setCategory(trimmed);
      setNewCategoryInput('');
      setIsAddingCategory(false);
    }
  };

  const handleAddCoMentor = () => {
    const assignedIds = new Set(assignedMentors.map(m => m.mentorId));
    const available = activeMentors.find(m => !assignedIds.has(m.id) && m.name !== leadInstructor) || activeMentors[1] || activeMentors[0];
    if (!available) return;

    setAssignedMentors([
      {
        mentorId: assignedMentors[0]?.mentorId || activeMentors[0]?.id || 'm-1',
        mentorName: assignedMentors[0]?.mentorName || leadInstructor,
        sharePercentage: 50,
        role: 'Lead Instructor'
      },
      {
        mentorId: available.id,
        mentorName: available.name,
        sharePercentage: 50,
        role: 'Co-Instructor'
      }
    ]);
  };

  const handleRemoveCoMentor = (index: number) => {
    const updated = assignedMentors.filter((_, i) => i !== index);
    if (updated.length === 1) {
      updated[0] = { ...updated[0], sharePercentage: 100, role: 'Lead Instructor' };
    }
    setAssignedMentors(updated);
  };

  const handleSplitPreset = (leadPct: number, coPct: number) => {
    if (assignedMentors.length >= 2) {
      setAssignedMentors([
        { ...assignedMentors[0], sharePercentage: leadPct },
        { ...assignedMentors[1], sharePercentage: coPct }
      ]);
    }
  };

  const handleLeadMentorChange = (name: string) => {
    setLeadInstructor(name);
    const leadObj = activeMentors.find(m => m.name === name);
    setAssignedMentors(prev => {
      if (prev.length === 0) {
        return [{
          mentorId: leadObj?.id || 'm-1',
          mentorName: name,
          sharePercentage: 100,
          role: 'Lead Instructor'
        }];
      }
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        mentorId: leadObj?.id || updated[0].mentorId,
        mentorName: name,
      };
      return updated;
    });
  };

  const handleCoMentorChange = (name: string) => {
    const mentorObj = activeMentors.find(m => m.name === name);
    setAssignedMentors(prev => {
      if (prev.length < 2) return prev;
      const updated = [...prev];
      updated[1] = {
        ...updated[1],
        mentorId: mentorObj?.id || updated[1].mentorId,
        mentorName: name,
      };
      return updated;
    });
  };

  if (!isOpen) return null;

  const handleAddModule = () => {
    if (newModuleText.trim()) {
      setModules(prev => [...prev, newModuleText.trim()]);
      setNewModuleText('');
    }
  };

  const handleRemoveModule = (index: number) => {
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) return;

    addCourse({
      code: code.toUpperCase(),
      title,
      category,
      description: description || `Comprehensive professional training track in ${title}.`,
      durationWeeks: Number(durationWeeks),
      tuitionFee: Number(tuitionFee),
      syllabusModules: modules.length > 0 ? modules : ['Curriculum Overview & Practical Labs'],
      leadInstructor: assignedMentors[0]?.mentorName || leadInstructor,
      assignedMentors,
      status: 'Active',
      curriculumDriveUrl: curriculumDriveUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/40 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="my-auto glass-panel relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">library_add</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-base sm:text-lg font-bold text-on-surface">Add Academic Program / Course</h2>
              <p className="font-body-sm text-xs text-secondary">Define curriculum syllabus, duration, tuition pricing in ₦, and faculty lead.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Program Title <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Applied Artificial Intelligence & LLM Engineering"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Course Code <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. AI-601"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs text-secondary font-semibold">Track Category</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    + Add New
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                      }
                    }}
                    placeholder="e.g. Artificial Intelligence, DevOps..."
                    className="flex-1 h-10 px-3 bg-surface border border-primary rounded font-body-md text-sm text-on-surface outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewCategory}
                    className="px-3 h-10 bg-primary text-white rounded font-label-md text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCategory(false); setNewCategoryInput(''); }}
                    className="px-2.5 h-10 border border-outline-variant rounded font-label-md text-xs text-secondary hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__" className="font-semibold text-primary">
                    + Add New Category...
                  </option>
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Duration (Weeks)</label>
              <input
                type="number"
                min="4"
                max="52"
                value={durationWeeks}
                onChange={e => setDurationWeeks(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Standard Tuition Fee (₦)</label>
              <input
                type="number"
                step="10000"
                value={tuitionFee}
                onChange={e => setTuitionFee(Number(e.target.value))}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm font-bold text-primary focus:border-primary outline-none"
              />
            </div>

            {/* Multi-Mentor Assignment & Revenue Split Section */}
            <div className="space-y-3 sm:col-span-2 p-3.5 rounded-xl border border-outline-variant bg-surface-container/30">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-label-md text-xs text-on-surface font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                    Faculty Mentors & Revenue Split (37% Tuition Pool)
                  </label>
                  <p className="font-body-sm text-[11px] text-secondary">
                    Allocate up to 2 instructors to co-mentor this track. Revenue pool (37% of tuition: {formatNaira(Math.round(Number(tuitionFee || 0) * 0.37))}) is shared automatically.
                  </p>
                </div>
                {assignedMentors.length < 2 && activeMentors.length > 1 && (
                  <button
                    type="button"
                    onClick={handleAddCoMentor}
                    className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">person_add</span>
                    <span>Add Co-Mentor</span>
                  </button>
                )}
              </div>

              {/* Lead Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className={assignedMentors.length > 1 ? "sm:col-span-7" : "sm:col-span-12"}>
                  <label className="font-label-md text-[11px] text-secondary font-semibold">Lead Faculty Instructor</label>
                  <select
                    value={assignedMentors[0]?.mentorName || leadInstructor}
                    onChange={e => handleLeadMentorChange(e.target.value)}
                    className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                  >
                    {activeMentors.length === 0 ? (
                      <option value="General Faculty">General Faculty Pool (Unassigned)</option>
                    ) : (
                      activeMentors.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.department})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {assignedMentors.length > 1 && (
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="font-label-md text-[11px] text-secondary font-semibold">Share (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={assignedMentors[0]?.sharePercentage || 50}
                        onChange={e => {
                          const val = Math.min(99, Math.max(1, Number(e.target.value) || 50));
                          setAssignedMentors([
                            { ...assignedMentors[0], sharePercentage: val },
                            { ...assignedMentors[1], sharePercentage: 100 - val }
                          ]);
                        }}
                        className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm font-bold text-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="text-right pt-4">
                      <span className="text-xs font-data-tabular font-bold text-primary">
                        {formatNaira(Math.round((Number(tuitionFee || 0) * 0.37) * ((assignedMentors[0]?.sharePercentage || 50) / 100)))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Co-Instructor if added */}
              {assignedMentors.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2 border-t border-outline-variant/60">
                  <div className="sm:col-span-7">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="font-label-md text-[11px] text-secondary font-semibold">Co-Faculty Mentor</label>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoMentor(1)}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        <span>Remove</span>
                      </button>
                    </div>
                    <select
                      value={assignedMentors[1]?.mentorName}
                      onChange={e => handleCoMentorChange(e.target.value)}
                      className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
                    >
                      {activeMentors.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-5 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="font-label-md text-[11px] text-secondary font-semibold">Share (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={assignedMentors[1]?.sharePercentage || 50}
                        onChange={e => {
                          const val = Math.min(99, Math.max(1, Number(e.target.value) || 50));
                          setAssignedMentors([
                            { ...assignedMentors[0], sharePercentage: 100 - val },
                            { ...assignedMentors[1], sharePercentage: val }
                          ]);
                        }}
                        className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-data-tabular text-sm font-bold text-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="text-right pt-4">
                      <span className="text-xs font-data-tabular font-bold text-primary">
                        {formatNaira(Math.round((Number(tuitionFee || 0) * 0.37) * ((assignedMentors[1]?.sharePercentage || 50) / 100)))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Split Presets */}
              {assignedMentors.length > 1 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-secondary font-semibold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleSplitPreset(50, 50)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      assignedMentors[0]?.sharePercentage === 50
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant text-secondary hover:text-on-surface'
                    }`}
                  >
                    50 / 50 Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitPreset(60, 40)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      assignedMentors[0]?.sharePercentage === 60
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant text-secondary hover:text-on-surface'
                    }`}
                  >
                    60 / 40 Lead Heavy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitPreset(70, 30)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      assignedMentors[0]?.sharePercentage === 70
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant text-secondary hover:text-on-surface'
                    }`}
                  >
                    70 / 30 Advisory
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Program Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Key outcomes, technologies taught, and prerequisites..."
                className="w-full p-2.5 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">link</span>
                Official Course Curriculum (Google Drive URL)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={curriculumDriveUrl}
                onChange={e => setCurriculumDriveUrl(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none"
              />
              <span className="text-[10px] text-secondary">
                This Google Drive link is automatically attached to student admission letters &amp; welcome emails.
              </span>
            </div>

            {/* Syllabus Modules Dynamic List */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-outline-variant">
              <label className="font-label-md text-xs text-secondary font-semibold uppercase tracking-wider">
                Syllabus Curriculum Modules ({modules.length})
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModuleText}
                  onChange={e => setNewModuleText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddModule(); } }}
                  placeholder="e.g. Module 3: Microservices & Event Architecture"
                  className="flex-1 h-9 px-3 bg-surface border border-outline-variant rounded text-xs text-on-surface focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="px-3 h-9 bg-secondary-container text-primary rounded font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors"
                >
                  + Add Module
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {modules.map((mod, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded bg-surface border border-outline-variant text-xs">
                    <span className="text-on-surface font-medium">{index + 1}. {mod}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(index)}
                      className="text-secondary hover:text-error transition-colors p-0.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="p-3 bg-secondary-container/30 rounded-lg border border-outline-variant flex justify-between items-center text-xs">
            <span className="font-semibold text-on-surface">Configured Tuition:</span>
            <span className="font-data-tabular font-bold text-sm text-primary">
              {formatNaira(tuitionFee)}
            </span>
          </div>
        </div>

        {/* Sticky Footer Submit Buttons */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-bright border-t border-outline-variant flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 h-10 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>Create Program Course</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};
