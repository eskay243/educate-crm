import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';

interface InstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstantMeetingModal: React.FC<InstantMeetingModalProps> = ({ isOpen, onClose }) => {
  const { settings, currentUser, createSipcoreMeeting, showToast } = useCRM();

  const [title, setTitle] = useState('Nexus Live Class & Ad-Hoc Sync');
  const [description, setDescription] = useState('');
  const [enableAiNotetaker, setEnableAiNotetaker] = useState(
    settings.sipcore?.enableAiNotetakerDefault !== false
  );
  const [isRecorded, setIsRecorded] = useState(
    Boolean(settings.sipcore?.isRecordedDefault)
  );
  const [extension, setExtension] = useState(
    currentUser?.sipcoreExtension || settings.sipcore?.defaultCreatorExtension || '4102'
  );

  const [isCreating, setIsCreating] = useState(false);
  const [meetingResult, setMeetingResult] = useState<{
    joinUrl: string;
    publicMeetingCode: string;
    moderatorPin?: string;
    participantPin?: string;
    enableAiNotetaker?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    setLastError(null);
    try {
      const data = await createSipcoreMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        createdByExtension: extension.trim() || undefined,
        isInstant: true,
        enableAiNotetaker,
        isRecorded,
        allowGuestJoin: true,
      });

      if (data) {
        setMeetingResult(data);
        showToast('Meeting Created', `SIPCore Room ready: ${data.publicMeetingCode}`, 'success');
      } else {
        setLastError('The SIPCore Cloud Media Bridge (4.206.202.181) on Softworks US is currently unresponsive. The upstream team has been alerted. You can use Google Meet below as an instant backup.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!meetingResult?.joinUrl) return;
    navigator.clipboard.writeText(meetingResult.joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link Copied', 'Public meeting link copied to clipboard', 'info');
  };

  const handleShareWhatsApp = () => {
    if (!meetingResult?.joinUrl) return;
    const msg = `Join our live class: *${title}*\nMeeting Link: ${meetingResult.joinUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleReset = () => {
    setMeetingResult(null);
    setTitle('Nexus Live Class & Ad-Hoc Sync');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-inverse-surface/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start items-center animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="my-auto relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-surface-container-lowest border border-outline-variant z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">videocam</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-on-surface">Instant Virtual Classroom</h2>
              <p className="font-body-sm text-on-surface-variant text-xs">SIPCore Web Conferencing &amp; AI Note Taker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!meetingResult ? (
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              {lastError && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 shrink-0 text-base">cloud_off</span>
                    <div>
                      <strong className="block font-semibold">SIPCore Upstream Cloud Media Outage</strong>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">{lastError}</p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">videocam</span>
                      <span>Launch Google Meet Fallback</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setLastError(null)}
                      className="text-[11px] text-amber-700 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Meeting Topic / Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced TypeScript &amp; Backend Architecture Sync"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Agenda / Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Reviewing student pull requests and answering lab questions"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Host Extension Number
                </label>
                <input
                  type="text"
                  value={extension}
                  onChange={e => setExtension(e.target.value)}
                  placeholder="e.g. 4102"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-outline-variant text-sm font-mono text-on-surface focus:border-primary outline-none"
                />
                <span className="text-[11px] text-secondary mt-1 block">
                  Authorised SIPCore company user extension assigned to host the session.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant space-y-2.5">
                <span className="text-xs font-bold text-on-surface block">Smart Conferencing Options</span>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={enableAiNotetaker}
                    onChange={e => setEnableAiNotetaker(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-on-surface block">Enable SIPCore AI Note Taker</span>
                    <span className="text-[11px] text-secondary">
                      AI participant transcribes spoken speech and prepares high-yield study summaries.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isRecorded}
                    onChange={e => setIsRecorded(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-on-surface block">Request Meeting Recording</span>
                    <span className="text-[11px] text-secondary">
                      Records audio and video streams for student replay archives.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Provisioning SIPCore Room...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">rocket_launch</span>
                      <span>Generate &amp; Launch Room</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
                <span className="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">check_circle</span>
                <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Room Ready for Students &amp; Faculty
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Meeting Code: <strong className="font-mono">{meetingResult.publicMeetingCode}</strong>
                </p>
              </div>

              {/* Public Join Link Box */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Public Browser Join URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={meetingResult.joinUrl}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface border border-outline-variant text-xs font-mono text-on-surface select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-secondary mt-1 block">
                  Students join directly in any modern browser without needing a SIPCore account.
                </span>
              </div>

              {/* PIN info if present */}
              {(meetingResult.moderatorPin || meetingResult.participantPin) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {meetingResult.moderatorPin && (
                    <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant">
                      <span className="text-secondary block text-[10px] uppercase font-bold">Moderator PIN</span>
                      <span className="font-mono font-bold text-on-surface">{meetingResult.moderatorPin}</span>
                    </div>
                  )}
                  {meetingResult.participantPin && (
                    <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant">
                      <span className="text-secondary block text-[10px] uppercase font-bold">Participant PIN</span>
                      <span className="font-mono font-bold text-on-surface">{meetingResult.participantPin}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={meetingResult.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                  <span>Enter Virtual Classroom Now</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="h-9 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-9 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs border border-outline-variant flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>New Meeting</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
