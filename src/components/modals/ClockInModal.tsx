import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { WorkMode, GeoVerificationStatus } from '../../types/crm';
import { getDeviceCoordinates, calculateDistanceMeters } from '../../utils/geo';

export interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_CHORES = [
  'Student Admissions & Lead Follow-ups',
  'Curriculum Review & Code Mentoring',
  'Tuition Invoicing & Bank Reconciliation',
  'Student Helpdesk & Technical Support',
  'Academic Faculty Management',
];

export const ClockInModal: React.FC<ClockInModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, clockIn, settings } = useCRM();

  const [workMode, setWorkMode] = useState<WorkMode>('On-Site / Hub');
  const [locationName, setLocationName] = useState('');
  const [dailyTasksFocus, setDailyTasksFocus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoVerificationStatus>('GPS Unavailable');
  const [geoMessage, setGeoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const office = settings.officeLocation || {
    name: 'Lagos Headquarters Hub (Yaba, Lagos)',
    latitude: 6.5181,
    longitude: 3.3768,
    radiusMeters: 400,
  };

  const policy = settings.workHoursPolicy || {
    expectedClockInTime: '09:00',
    expectedClockOutTime: '17:00',
    gracePeriodMinutes: 15,
  };

  // Initialize or fetch GPS when modal opens or workMode switches
  useEffect(() => {
    if (!isOpen) return;

    if (workMode === 'Remote') {
      setLocationName('Remote Workstation (Home / Flex)');
      setGeoStatus('Remote Verified');
      setGeoMessage('Remote work mode enabled. Geolocation validation bypassed.');
      setDistanceMeters(null);
      return;
    }

    setLocationName(office.name);

    const checkLocation = async () => {
      setIsLocating(true);
      setGeoMessage('Acquiring high-accuracy GPS coordinates from device...');
      try {
        const deviceCoords = await getDeviceCoordinates();
        setCoords({ lat: deviceCoords.latitude, lng: deviceCoords.longitude });

        const dist = calculateDistanceMeters(
          deviceCoords.latitude,
          deviceCoords.longitude,
          office.latitude,
          office.longitude
        );
        const roundedDist = Math.round(dist);
        setDistanceMeters(roundedDist);

        if (roundedDist <= office.radiusMeters) {
          setGeoStatus('Verified On-Site');
          setGeoMessage(`GPS Match Verified: You are ${roundedDist}m from ${office.name} (within ${office.radiusMeters}m perimeter).`);
        } else {
          setGeoStatus('Location Mismatch');
          const distKm = (roundedDist / 1000).toFixed(1);
          setGeoMessage(`Location Warning: Device is ${distKm}km away from ${office.name} (exceeds ${office.radiusMeters}m perimeter). Shift will be flagged.`);
        }
      } catch {
        setGeoStatus('GPS Unavailable');
        setGeoMessage('Unable to access device GPS (permission denied or network restricted). Hub location recorded as reported.');
      } finally {
        setIsLocating(false);
      }
    };

    checkLocation();
  }, [isOpen, workMode, office]);

  if (!isOpen) return null;

  // Punctuality check for display
  const now = new Date();
  const [expHour, expMin] = (settings.workHoursPolicy?.expectedClockInTime || '09:00').split(':').map(Number);
  const grace = settings.workHoursPolicy?.gracePeriodMinutes ?? 15;
  const expectedMinutes = expHour * 60 + expMin + grace;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isPunctual = currentMinutes <= expectedMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyTasksFocus.trim()) return;

    setIsSubmitting(true);
    try {
      await clockIn({
        workMode,
        locationName,
        dailyTasksFocus: dailyTasksFocus.trim(),
        lat: coords.lat,
        lng: coords.lng,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const addChoreChip = (chore: string) => {
    setDailyTasksFocus(prev => {
      if (!prev) return chore;
      if (prev.includes(chore)) return prev;
      return `${prev}; ${chore}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-margin-page animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="glass-panel relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-surface-container-lowest border border-outline-variant z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-stack-md px-stack-lg border-b border-outline-variant bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">timer</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-on-surface">Staff Clock-In &amp; Shift Verification</h2>
              <p className="font-body-sm text-xs text-secondary">
                Hybrid Attendance • GPS Location Verification • Daily Office Tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-stack-lg space-y-4 flex-1">
          {/* Current Staff & Time Card */}
          <div className="p-3 bg-surface rounded-lg border border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{currentUser?.name}</p>
                <p className="text-xs text-secondary">{currentUser?.roleTitle || currentUser?.role} • {currentUser?.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-secondary">Shift Time</p>
                <p className="font-bold text-sm font-data-tabular text-on-surface">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                isPunctual ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
              }`}>
                {isPunctual ? '● On-Time' : '● Late Arrival'}
              </span>
            </div>
          </div>

          {/* Work Mode Selection */}
          <div className="space-y-1.5">
            <label className="font-label-md text-xs font-semibold text-secondary">
              Work Environment / Station <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkMode('On-Site / Hub')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  workMode === 'On-Site / Hub'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-outline-variant bg-surface hover:border-outline'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${workMode === 'On-Site / Hub' ? 'text-primary' : 'text-secondary'}`}>
                  domain
                </span>
                <div>
                  <p className="font-bold text-xs text-on-surface">On-Site / Office Hub</p>
                  <p className="text-[11px] text-secondary">Working at physical campus / office</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWorkMode('Remote')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  workMode === 'Remote'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-outline-variant bg-surface hover:border-outline'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${workMode === 'Remote' ? 'text-primary' : 'text-secondary'}`}>
                  home_work
                </span>
                <div>
                  <p className="font-bold text-xs text-on-surface">Remote / Flex</p>
                  <p className="text-[11px] text-secondary">Home office or flex workstation</p>
                </div>
              </button>
            </div>
          </div>

          {/* Location & GPS Status Banner */}
          <div className="p-3.5 rounded-lg border border-outline-variant bg-surface-container-lowest space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                Station Location:
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                geoStatus === 'Verified On-Site' || geoStatus === 'Remote Verified'
                  ? 'bg-[#dcfce7] text-[#166534]'
                  : geoStatus === 'Location Mismatch'
                  ? 'bg-[#fef3c7] text-[#92400e]'
                  : 'bg-surface-container text-secondary'
              }`}>
                {isLocating ? 'Acquiring GPS...' : geoStatus}
              </span>
            </div>

            <input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="e.g. Lagos Hub - 3rd Floor"
              className="w-full h-9 px-3 bg-surface border border-outline-variant rounded font-body-md text-xs text-on-surface focus:border-primary outline-none"
            />

            <p className="text-[11px] text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">
                {geoStatus === 'Verified On-Site' ? 'check_circle' : geoStatus === 'Location Mismatch' ? 'warning' : 'info'}
              </span>
              <span>{geoMessage}</span>
            </p>

            {distanceMeters !== null && (
              <p className="text-[10px] text-secondary font-data-tabular">
                Registered Hub: {office.name} ({office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}) • Perimeter: {office.radiusMeters}m
              </p>
            )}
          </div>

          {/* Daily Office Chores & Focus */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-xs font-semibold text-secondary">
                Today&apos;s Core Office Chores &amp; Objectives <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-secondary">Required for productivity audit</span>
            </div>

            <textarea
              required
              rows={3}
              value={dailyTasksFocus}
              onChange={e => setDailyTasksFocus(e.target.value)}
              placeholder="Detail specific tasks, student inquiries, reconciliations, or operational chores you will execute today..."
              className="w-full p-3 bg-surface border border-outline-variant rounded-lg font-body-md text-xs text-on-surface focus:border-primary outline-none resize-none"
            />

            {/* Quick Chores Selection Chips */}
            <div className="space-y-1">
              <p className="text-[11px] text-secondary font-medium">Quick Chores Tag:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CHORES.map(chore => (
                  <button
                    key={chore}
                    type="button"
                    onClick={() => addChoreChip(chore)}
                    className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[11px] text-on-surface transition-colors cursor-pointer"
                  >
                    + {chore}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Policy Reminder */}
          <div className="p-2.5 bg-surface-bright rounded border border-outline-variant flex items-center gap-2 text-[11px] text-secondary">
            <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
            <span>
              Official institutional work policy: {policy.expectedClockInTime} - {policy.expectedClockOutTime} (WAT) with a {policy.gracePeriodMinutes}-minute arrival grace period.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-outline-variant text-xs font-bold text-secondary hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !dailyTasksFocus.trim()}
              className="px-5 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>{isSubmitting ? 'Verifying...' : 'Confirm Clock-In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
