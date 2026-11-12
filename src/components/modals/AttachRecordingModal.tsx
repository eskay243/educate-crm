import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';

interface AttachRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttachRecordingModal: React.FC<AttachRecordingModalProps> = ({ isOpen, onClose }) => {
  const { 
    selectedSlotForRecording, 
    setSelectedSlotForRecording, 
    attachTimetableRecording, 
    lmsModules, 
    showToast 
  } = useCRM();

  const [rawUrl, setRawUrl] = useState('');
  const [recordingNotes, setRecordingNotes] = useState('');
  const [syncToLms, setSyncToLms] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedSlotForRecording) {
      setRawUrl(selectedSlotForRecording.recordingUrl || '');
      setRecordingNotes(
        selectedSlotForRecording.recordingNotes || 
        selectedSlotForRecording.aiTranscriptSummary?.overview || 
        ''
      );
    }
  }, [selectedSlotForRecording]);

  // Compute detected embed URL and platform
  const { embedUrl, platform } = useMemo(() => {
    if (!rawUrl.trim()) return { embedUrl: '', platform: 'none' };
    const trimmed = rawUrl.trim();

    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, platform: 'YouTube' };
    }

    // Google Drive
    const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
    const gdriveId = gdriveMatch ? (gdriveMatch[1] || gdriveMatch[2]) : null;
    if (gdriveId) {
      return { embedUrl: `https://drive.google.com/file/d/${gdriveId}/preview`, platform: 'Google Drive' };
    }

    // Loom
    const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
    if (loomMatch && loomMatch[1]) {
      return { embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`, platform: 'Loom' };
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, platform: 'Vimeo' };
    }

    if (trimmed.includes('sipcore.org') || trimmed.includes('softworks-us.org')) {
      return { embedUrl: trimmed, platform: 'SIPCore Replay' };
    }

    return { embedUrl: trimmed, platform: 'Custom Web Link' };
  }, [rawUrl]);

  // Course lessons matching slot
  const matchingLessons = useMemo(() => {
    if (!selectedSlotForRecording) return [];
    return lmsModules
      .filter(m => !selectedSlotForRecording.courseTitle || m.courseTitle === selectedSlotForRecording.courseTitle)
      .flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));
  }, [lmsModules, selectedSlotForRecording]);

  useEffect(() => {
    if (matchingLessons.length > 0 && !selectedLessonId) {
      // Find lesson with similar title
      const found = matchingLessons.find(l => 
        l.title === selectedSlotForRecording?.topic || 
        selectedSlotForRecording?.topic?.includes(l.title)
      );
      setSelectedLessonId(found?.id || matchingLessons[0]?.id || '');
    }
  }, [matchingLessons, selectedSlotForRecording, selectedLessonId]);

  if (!isOpen || !selectedSlotForRecording) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawUrl.trim()) {
      showToast('Validation Error', 'Please enter a valid video recording URL.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await attachTimetableRecording({
        slotId: selectedSlotForRecording.id,
        recordingUrl: embedUrl || rawUrl.trim(),
        recordingNotes: recordingNotes.trim() || undefined,
        aiTranscriptSummary: recordingNotes.trim() ? { overview: recordingNotes.trim() } : undefined,
        syncToLmsLesson: syncToLms,
        lessonId: selectedLessonId || undefined,
      });

      onClose();
      setSelectedSlotForRecording(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="my-auto relative w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">smart_display</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-on-surface">Publish Lecture Replay (Approach 3)</h2>
              <p className="font-body-sm text-on-surface-variant text-xs">
                Link video stream &amp; AI study notes to student portal without VPS disk usage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Slot Context Banner */}
          <div className="p-3.5 rounded-xl bg-surface border border-outline-variant space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-bold">
                {selectedSlotForRecording.dayOfWeek} • {selectedSlotForRecording.date}
              </span>
              <span className="text-xs text-secondary">{selectedSlotForRecording.courseTitle}</span>
            </div>
            <h3 className="font-bold text-sm text-on-surface">{selectedSlotForRecording.topic}</h3>
            <p className="text-xs text-secondary">
              Faculty: <strong className="text-on-surface">{selectedSlotForRecording.mentorName}</strong> • Cohort: {selectedSlotForRecording.cohortName}
            </p>
          </div>

          {/* Recording Link Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Video Replay URL *
              </label>
              {platform !== 'none' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Detected: {platform}
                </span>
              )}
            </div>
            <input
              type="url"
              required
              value={rawUrl}
              onChange={e => setRawUrl(e.target.value)}
              placeholder="Paste YouTube Unlisted, Google Drive, Loom, or Vimeo video link..."
              className="w-full h-10 px-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:border-primary outline-none"
            />
            <span className="text-[11px] text-secondary mt-1 block">
              Supports: YouTube (watch/embed), Google Drive (/preview), Loom, Vimeo, and SIPCore replay links.
            </span>
          </div>

          {/* Live Embed Video Preview */}
          {embedUrl && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-on-surface block">Student Player Preview</span>
              <div className="rounded-xl overflow-hidden aspect-video bg-black shadow-inner border border-outline-variant">
                <iframe
                  src={embedUrl}
                  title="Lecture Preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* AI Study Notes / Topic Summary */}
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
              AI Study Notes &amp; Key Concepts Summary
            </label>
            <textarea
              rows={4}
              value={recordingNotes}
              onChange={e => setRecordingNotes(e.target.value)}
              placeholder="Paste or write timestamped chapters, key takeaways, and code snippets from the lecture..."
              className="w-full p-3 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface leading-relaxed focus:border-primary outline-none resize-y"
            />
            <span className="text-[11px] text-secondary mt-1 block">
              Displayed directly beneath the video player in the Student LMS Classroom for quick revision without consuming cellular data.
            </span>
          </div>

          {/* Auto-Sync to LMS Curriculum */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={syncToLms}
                onChange={e => setSyncToLms(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant"
              />
              <span>Automatically sync this video replay to Student LMS Syllabus</span>
            </label>

            {syncToLms && matchingLessons.length > 0 && (
              <div className="pt-1">
                <label className="block text-[11px] text-secondary mb-1">Target Syllabus Lesson:</label>
                <select
                  value={selectedLessonId}
                  onChange={e => setSelectedLessonId(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface outline-none"
                >
                  {matchingLessons.map(les => (
                    <option key={les.id} value={les.id}>
                      {les.moduleTitle} • {les.title} ({les.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  <span>Save &amp; Publish Replay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
