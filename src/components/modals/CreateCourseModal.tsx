import React, { useState } from 'react';
import { useCRM, formatNaira } from '../../context/CRMContext';

export interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose }) => {
  const { mentors, addCourse } = useCRM();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [tuitionFee, setTuitionFee] = useState(850000);
  const [leadInstructor, setLeadInstructor] = useState(mentors[0]?.name || 'Dr. Arthur Pendelton');
  const [modules, setModules] = useState<string[]>([
    'Core Foundational Architecture',
    'Applied Industry Capstone & System Design',
  ]);
  const [newModuleText, setNewModuleText] = useState('');

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
      leadInstructor,
      status: 'Active',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">library_add</span>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Add Academic Program / Course</h2>
              <p className="font-body-sm text-xs text-secondary">Define curriculum syllabus, duration, tuition pricing in ₦, and faculty lead.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
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
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-mono text-sm text-on-surface focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Track Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="Data Science">Data Science</option>
                <option value="Product Design">Product Design</option>
                <option value="Cloud Engineering">Cloud Engineering</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Product Management">Product Management</option>
              </select>
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

            <div className="space-y-1 sm:col-span-2">
              <label className="font-label-md text-xs text-secondary font-semibold">Lead Faculty Instructor</label>
              <select
                value={leadInstructor}
                onChange={e => setLeadInstructor(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
              >
                {mentors.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
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

          {/* Footer Submit Buttons */}
          <div className="pt-stack-sm flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded border border-outline-variant font-label-md text-xs font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
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
