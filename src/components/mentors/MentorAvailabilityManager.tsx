import React, { useState } from 'react';
import { Mentor, MentorAvailabilitySlot } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';

interface MentorAvailabilityManagerProps {
  mentors: Mentor[];
  targetMentor: Mentor | null;
  isMentor: boolean;
  isSuperAdmin: boolean;
}

export const MentorAvailabilityManager: React.FC<MentorAvailabilityManagerProps> = ({
  mentors,
  targetMentor: initialTargetMentor,
  isMentor,
  isSuperAdmin,
}) => {
  const { updateMentor, showToast } = useCRM();

  const activeMentorsList = mentors.filter(m => m.isActive !== false && m.status !== 'Deactivated');

  const [selectedMentorId, setSelectedMentorId] = useState<string>(
    initialTargetMentor?.id || activeMentorsList[0]?.id || mentors[0]?.id || ''
  );

  const activeMentor = mentors.find(m => m.id === selectedMentorId) || initialTargetMentor || activeMentorsList[0] || mentors[0];

  // Local state for office hour slots
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>(
    activeMentor?.officeHours || []
  );

  // Form state for adding a slot
  const [dayOfWeek, setDayOfWeek] = useState<MentorAvailabilitySlot['dayOfWeek']>('Tuesday');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [locationType, setLocationType] = useState<MentorAvailabilitySlot['locationType']>('Google Meet (Online)');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/nex-codelab-1on1');

  // Preview tab state
  const [previewDay, setPreviewDay] = useState<string>('Tuesday');

  // Sync selectedMentorId when targetMentor or mentors list updates
  React.useEffect(() => {
    if (initialTargetMentor?.id && selectedMentorId !== initialTargetMentor.id) {
      setSelectedMentorId(initialTargetMentor.id);
    } else if (!selectedMentorId && mentors[0]?.id) {
      setSelectedMentorId(mentors[0].id);
    }
  }, [initialTargetMentor?.id, mentors]);

  // Sync slots when active mentor changes
  React.useEffect(() => {
    if (activeMentor) {
      setSlots(activeMentor.officeHours || []);
    }
  }, [activeMentor?.id, activeMentor?.officeHours]);

  const handleToggleSlot = (slotId: string) => {
    if (!activeMentor) return;
    const updated = slots.map(s => s.id === slotId ? { ...s, isActive: !s.isActive } : s);
    setSlots(updated);
    updateMentor(activeMentor.id, { officeHours: updated });
    showToast('Office Hours Updated', 'Slot status updated successfully.', 'success');
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!activeMentor) return;
    const updated = slots.filter(s => s.id !== slotId);
    setSlots(updated);
    updateMentor(activeMentor.id, { officeHours: updated });
    showToast('Slot Removed', 'Office hour slot removed.', 'info');
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMentor) return;

    if (startTime >= endTime) {
      showToast('Validation Error', 'Start time must be before end time.', 'warning');
      return;
    }

    const newSlot: MentorAvailabilitySlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: Number(slotDurationMinutes),
      locationType,
      meetingLink: meetingLink.trim() || undefined,
      isActive: true,
    };

    const updated = [...slots, newSlot];
    setSlots(updated);
    updateMentor(activeMentor.id, { officeHours: updated });
    showToast('Slot Added', `New ${dayOfWeek} office hours configured (${startTime} - ${endTime}).`, 'success');
  };

  const handleApplyPreset = (preset: 'tue_thu' | 'mon_wed' | 'saturday') => {
    if (!activeMentor) return;

    let newPresetSlots: MentorAvailabilitySlot[] = [];
    if (preset === 'tue_thu') {
      newPresetSlots = [
        {
          id: `slot-${Date.now()}-1`,
          dayOfWeek: 'Tuesday',
          startTime: '14:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          locationType: 'Google Meet (Online)',
          meetingLink: 'https://meet.google.com/nex-codelab-1on1',
          isActive: true,
        },
        {
          id: `slot-${Date.now()}-2`,
          dayOfWeek: 'Thursday',
          startTime: '14:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          locationType: 'Google Meet (Online)',
          meetingLink: 'https://meet.google.com/nex-codelab-1on1',
          isActive: true,
        },
      ];
    } else if (preset === 'mon_wed') {
      newPresetSlots = [
        {
          id: `slot-${Date.now()}-1`,
          dayOfWeek: 'Monday',
          startTime: '10:00',
          endTime: '13:00',
          slotDurationMinutes: 30,
          locationType: 'Google Meet (Online)',
          meetingLink: 'https://meet.google.com/nex-codelab-1on1',
          isActive: true,
        },
        {
          id: `slot-${Date.now()}-2`,
          dayOfWeek: 'Wednesday',
          startTime: '10:00',
          endTime: '13:00',
          slotDurationMinutes: 30,
          locationType: 'Google Meet (Online)',
          meetingLink: 'https://meet.google.com/nex-codelab-1on1',
          isActive: true,
        },
      ];
    } else if (preset === 'saturday') {
      newPresetSlots = [
        {
          id: `slot-${Date.now()}-1`,
          dayOfWeek: 'Saturday',
          startTime: '11:00',
          endTime: '15:00',
          slotDurationMinutes: 45,
          locationType: 'Campus Hub Lab',
          meetingLink: 'https://meet.google.com/nex-codelab-lab',
          isActive: true,
        },
      ];
    }

    const updated = [...slots, ...newPresetSlots];
    setSlots(updated);
    updateMentor(activeMentor.id, { officeHours: updated });
    showToast('Preset Applied', 'Pre-configured office hours slots added.', 'success');
  };

  // Helper to generate discrete time intervals for preview
  const generateIntervals = (start: string, end: string, durationMin: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let cur = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const intervals: string[] = [];

    while (cur + durationMin <= endTotal) {
      const h1 = String(Math.floor(cur / 60)).padStart(2, '0');
      const m1 = String(cur % 60).padStart(2, '0');
      const next = cur + durationMin;
      const h2 = String(Math.floor(next / 60)).padStart(2, '0');
      const m2 = String(next % 60).padStart(2, '0');
      intervals.push(`${h1}:${m1} - ${h2}:${m2}`);
      cur = next;
    }
    return intervals;
  };

  const activeSlots = slots.filter(s => s.isActive);
  const previewSlotsForDay = slots.filter(s => s.dayOfWeek === previewDay && s.isActive);

  return (
    <div className="p-stack-md space-y-6">
      {/* Header & Mentor Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h3 className="font-bold text-base text-on-surface">
              {isMentor ? 'My Weekly Office Hours & Self-Booking Slots' : 'Faculty Office Hours & Availability Management'}
            </h3>
          </div>
          <p className="text-xs text-secondary mt-1">
            Configure open coaching windows. Mentees can self-book directly into these slots on their student portal.
          </p>
        </div>

        {/* Admin Mentor Switcher */}
        {!isMentor && (isSuperAdmin || mentors.length > 1) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-secondary">Faculty Member:</span>
            <select
              value={selectedMentorId}
              onChange={e => setSelectedMentorId(e.target.value)}
              className="h-9 px-3 bg-surface border border-outline-variant rounded-lg text-xs font-bold text-on-surface outline-none cursor-pointer focus:border-primary"
            >
              {activeMentorsList.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department || 'Faculty'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Mentor Summary Card */}
      {activeMentor && (
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary font-bold text-lg flex items-center justify-center shadow-xs">
              {activeMentor.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface">{activeMentor.name}</h4>
              <p className="text-xs text-secondary">{activeMentor.role} • {activeMentor.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {activeSlots.length} Active Weekly Windows
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              37% Commission Tier
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Slot List (7 cols) + Add New Form & Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configured Slots List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span>Configured Availability Windows ({slots.length})</span>
            </h4>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('tue_thu')}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-surface border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer"
                title="Add Tue & Thu 14:00 - 17:00"
              >
                + Tue/Thu Preset
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('saturday')}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-surface border border-outline-variant hover:border-primary text-on-surface transition-colors cursor-pointer"
                title="Add Saturday 11:00 - 15:00"
              >
                + Sat Lab Preset
              </button>
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-outline-variant rounded-xl space-y-2 bg-surface">
              <span className="material-symbols-outlined text-secondary text-3xl">event_busy</span>
              <p className="text-xs font-bold text-on-surface">No Office Hours Configured Yet</p>
              <p className="text-[11px] text-secondary max-w-sm mx-auto">
                Add weekly recurring timeslots using the form on the right or apply a quick preset so students can self-book coaching sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const intervals = generateIntervals(slot.startTime, slot.endTime, slot.slotDurationMinutes);
                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all shadow-xs ${
                      slot.isActive 
                        ? 'bg-surface border-outline-variant hover:border-primary/40' 
                        : 'bg-surface-container-low/50 border-dashed border-outline-variant/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            slot.dayOfWeek === 'Monday' || slot.dayOfWeek === 'Wednesday'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              : slot.dayOfWeek === 'Tuesday' || slot.dayOfWeek === 'Thursday'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {slot.dayOfWeek}
                          </span>
                          <span className="font-bold text-sm text-on-surface font-mono">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-[11px] text-secondary font-medium">
                            ({slot.slotDurationMinutes} min / {intervals.length} slots)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-on-surface">
                            <span className="material-symbols-outlined text-[15px] text-primary">
                              {slot.locationType.includes('Google') ? 'videocam' : slot.locationType.includes('Zoom') ? 'laptop' : 'location_on'}
                            </span>
                            <span>{slot.locationType}</span>
                          </span>

                          {slot.meetingLink && (
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              <span className="truncate max-w-[200px]">{slot.meetingLink}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSlot(slot.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            slot.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-surface-container text-secondary hover:text-on-surface'
                          }`}
                          title={slot.isActive ? 'Click to disable' : 'Click to enable'}
                        >
                          {slot.isActive ? 'Active' : 'Paused'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1 rounded text-secondary hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete slot"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add Slot Form & Student Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Slot Form */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
              <h4 className="font-bold text-sm text-on-surface">Add Recurring Office Hours</h4>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-secondary mb-1">Day of the Week *</label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value as any)}
                  className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-medium text-on-surface outline-none cursor-pointer focus:border-primary"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-secondary mb-1">Start Time (WAT) *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-mono text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1">End Time (WAT) *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-mono text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-secondary mb-1">Slot Duration *</label>
                  <select
                    value={slotDurationMinutes}
                    onChange={e => setSlotDurationMinutes(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-medium text-on-surface outline-none cursor-pointer focus:border-primary"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1">Platform / Mode *</label>
                  <select
                    value={locationType}
                    onChange={e => setLocationType(e.target.value as any)}
                    className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-medium text-on-surface outline-none cursor-pointer focus:border-primary"
                  >
                    <option value="Google Meet (Online)">Google Meet (Online)</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Campus Hub Lab">Lagos VI Campus Hub Lab</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-secondary mb-1">Meeting URL / Room Link</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-mono text-on-surface outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full h-9 mt-2 rounded bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Save Office Hours Window</span>
              </button>
            </form>
          </div>

          {/* Student Booking Preview Box */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">visibility</span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface">Student Booking View</h4>
              </div>
              <span className="text-[10px] text-secondary bg-surface px-2 py-0.5 rounded border border-outline-variant">Live Preview</span>
            </div>

            <p className="text-[11px] text-secondary">
              This is how your open slots render when mentees schedule a 1-on-1 coaching session with you:
            </p>

            {/* Day Selector for preview */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                const dayHasSlots = slots.some(s => s.dayOfWeek === day && s.isActive);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setPreviewDay(day)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      previewDay === day
                        ? 'bg-primary text-on-primary'
                        : dayHasSlots
                        ? 'bg-surface text-on-surface border border-outline-variant'
                        : 'bg-surface-container text-secondary/60 border border-transparent'
                    }`}
                  >
                    {day.substring(0, 3)}
                    {dayHasSlots && <span className="ml-1 text-[8px]">●</span>}
                  </button>
                );
              })}
            </div>

            {/* Generated Time Pills */}
            <div className="pt-2">
              {previewSlotsForDay.length === 0 ? (
                <p className="text-[11px] text-secondary italic py-3 text-center bg-surface rounded-lg border border-outline-variant">
                  No active office hours on {previewDay}.
                </p>
              ) : (
                <div className="space-y-2">
                  {previewSlotsForDay.map(slot => {
                    const intervals = generateIntervals(slot.startTime, slot.endTime, slot.slotDurationMinutes);
                    return (
                      <div key={slot.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-secondary">
                          <span className="font-semibold text-on-surface">{slot.locationType}</span>
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {intervals.map((intv, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="px-2 py-1.5 rounded-lg bg-surface border border-outline-variant hover:border-primary text-on-surface font-mono text-[10px] text-center font-bold hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                              {intv}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
