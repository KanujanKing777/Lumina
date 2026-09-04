import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Mic, 
  Square, 
  Trash2, 
  PenTool, 
  AlertCircle, 
  Film, 
  Volume2, 
  Plus, 
  Play, 
  Pause,
  Info
} from 'lucide-react';
import { MediaAttachment } from '../types';
import { DrawingModal } from './DrawingModal';

interface MediaManagerProps {
  media: MediaAttachment[];
  onAddMedia: (attachment: MediaAttachment) => void;
  onRemoveMedia: (id: string) => void;
  maxItems?: number;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const MediaManager: React.FC<MediaManagerProps> = ({
  media = [],
  onAddMedia,
  onRemoveMedia,
  maxItems = 6,
}) => {
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Image File Selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length >= maxItems) {
      setErrorMessage(`Maximum limit of ${maxItems} media attachments reached.`);
      return;
    }

    const file = files[0];

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported image format. Please upload JPEG, PNG, WebP, or GIF.');
      e.target.value = '';
      return;
    }

    // Validate Size
    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage('Image file is too large. Maximum allowed size is 5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAttachment: MediaAttachment = {
        id: 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
        type: 'image',
        name: file.name,
        url: dataUrl,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
      };
      onAddMedia(newAttachment);
      e.target.value = '';
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Handle Video File Selection
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length >= maxItems) {
      setErrorMessage(`Maximum limit of ${maxItems} media attachments reached.`);
      return;
    }

    const file = files[0];

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported video format. Please upload MP4 or WebM video.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setErrorMessage('Video file exceeds maximum limit of 15MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAttachment: MediaAttachment = {
        id: 'vid_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
        type: 'video',
        name: file.name,
        url: dataUrl,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
      };
      onAddMedia(newAttachment);
      e.target.value = '';
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read video file.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Start Voice Memo Recording
  const startAudioRecording = async () => {
    setErrorMessage(null);
    if (media.length >= maxItems) {
      setErrorMessage(`Maximum limit of ${maxItems} media attachments reached.`);
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all audio stream tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        if (audioBlob.size > MAX_AUDIO_SIZE) {
          setErrorMessage('Recorded voice memo exceeds size limits (5MB).');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newAudio: MediaAttachment = {
            id: 'audio_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
            type: 'audio',
            name: `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            url: base64Audio,
            mimeType: 'audio/webm',
            size: audioBlob.size,
            duration: recordingSeconds,
            createdAt: Date.now(),
          };
          onAddMedia(newAudio);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250); // Collect slice every 250ms
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 300) { // Max 5 minutes
            stopAudioRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access was denied. Please allow microphone permission in your browser.'
          : (err.message || 'Could not start voice recording.')
      );
    }
  };

  // Stop Voice Memo Recording
  const stopAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // Cancel Voice Memo Recording without saving
  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* Media Action Buttons & Recording Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
        
        {/* Left: Quick Attach Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Photo upload */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isRecordingAudio || media.length >= maxItems}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Attach a photo (JPEG, PNG, WebP, GIF up to 5MB)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Photo</span>
          </button>

          {/* Video upload */}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={isRecordingAudio || media.length >= maxItems}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Attach a video (MP4, WebM up to 15MB)"
          >
            <VideoIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Video</span>
          </button>

          {/* Audio voice recording button */}
          {!isRecordingAudio ? (
            <button
              type="button"
              onClick={startAudioRecording}
              disabled={media.length >= maxItems}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Record a voice memo"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Voice Memo</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="text-xs font-mono font-semibold">Recording: {formatSeconds(recordingSeconds)}</span>
              <button
                type="button"
                onClick={stopAudioRecording}
                className="p-1 text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                title="Stop & Save Recording"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={cancelAudioRecording}
                className="text-[11px] text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Drawing Pad trigger */}
          <button
            type="button"
            onClick={() => setIsDrawingOpen(true)}
            disabled={isRecordingAudio || media.length >= maxItems}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Create a mindful sketch or diagram"
          >
            <PenTool className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Sketch</span>
          </button>
        </div>

        {/* Right: Attachment counter */}
        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
          {media.length}/{maxItems} Media Attachments
        </span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-semibold underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Attachments List / Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs flex flex-col"
            >
              {/* Media Preview Body */}
              <div className="relative bg-stone-100 dark:bg-stone-950 aspect-16/10 flex items-center justify-center overflow-hidden">
                {item.type === 'image' && (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}

                {item.type === 'drawing' && (
                  <div className="w-full h-full p-2 bg-white flex items-center justify-center">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {item.type === 'video' && (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}

                {item.type === 'audio' && (
                  <div className="p-3 w-full flex flex-col items-center justify-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <audio
                      src={item.url}
                      controls
                      className="w-full max-h-8 scale-90"
                    />
                  </div>
                )}

                {/* Badge Tag */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-900/80 backdrop-blur-xs text-white uppercase tracking-wider">
                  {item.type}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveMedia(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 text-white hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
                  title="Remove attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Media Metadata Footer */}
              <div className="p-2.5 bg-white dark:bg-stone-900 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800/80">
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono shrink-0">
                  {formatFileSize(item.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawing Modal */}
      <DrawingModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onSaveDrawing={(drawingAttachment) => onAddMedia(drawingAttachment)}
      />
    </div>
  );
};
