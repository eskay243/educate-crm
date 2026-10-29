import React, { useState, useEffect, useRef } from 'react';

export interface VoiceMessageRecorderProps {
  onSendVoice: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSendVoice,
  onCancel,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startRecording = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMsg('Audio recording is not supported in this browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        // Pick supported mime type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100); // 100ms slice

        timerRef.current = setInterval(() => {
          setSeconds(prev => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Microphone access denied:', err);
        setErrorMsg('Microphone permission denied or device not found.');
      }
    };

    startRecording();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCancel();
  };

  const handleSend = () => {
    if (seconds < 1) {
      handleCancel();
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onSendVoice(base64data, seconds);
        };
        reader.readAsDataURL(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };

      try {
        mediaRecorderRef.current.stop();
      } catch {
        handleCancel();
      }
    } else {
      handleCancel();
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (errorMsg) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-error">error</span>
          <span>{errorMsg}</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs font-semibold px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
          <span className="w-3 h-3 rounded-full bg-rose-600 relative" />
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-error animate-pulse">mic</span>
          <span className="text-xs font-mono font-bold text-error">
            {formatTime(seconds)}
          </span>
          <span className="text-[11px] text-secondary hidden sm:inline font-medium">
            Recording audio...
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          title="Discard Voice Note"
          className="p-1.5 text-secondary hover:text-error hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>

        <button
          type="button"
          onClick={handleSend}
          title="Send Voice Note"
          className="px-3 py-1.5 rounded-lg bg-error hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
