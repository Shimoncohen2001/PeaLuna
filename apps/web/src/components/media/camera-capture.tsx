'use client';

import { useId, useRef } from 'react';
import { Camera, Images } from 'lucide-react';

const CAMERA_ACCEPT = 'image/*';
const LIBRARY_IMAGES = 'image/*,image/jpeg,image/png,image/webp,image/heic,image/heif';
const LIBRARY_WITH_VIDEO = `${LIBRARY_IMAGES},video/mp4,video/webm,video/quicktime`;

type CameraCaptureProps = {
  disabled?: boolean;
  multiple?: boolean;
  allowVideo?: boolean;
  onPick: (files: File[]) => void;
  cameraLabel: string;
  libraryLabel: string;
  hint?: string;
  tone?: 'light' | 'dark';
};

export function CameraCapture({
  disabled,
  multiple,
  allowVideo,
  onPick,
  cameraLabel,
  libraryLabel,
  hint,
  tone = 'light',
}: CameraCaptureProps) {
  const id = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function take(list: FileList | null, input: HTMLInputElement) {
    if (!list?.length) return;
    onPick(Array.from(list));
    input.value = '';
  }

  const btn =
    tone === 'dark'
      ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-[#f7efe8] active:bg-white/20 disabled:opacity-50'
      : 'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-ink/10 bg-warm-white px-3 text-sm text-ink active:bg-beige/60 disabled:opacity-50';

  return (
    <div className="space-y-2">
      <input
        id={`${id}-camera`}
        ref={cameraRef}
        name="camera"
        type="file"
        accept={CAMERA_ACCEPT}
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => take(e.target.files, e.currentTarget)}
      />
      <input
        id={`${id}-library`}
        ref={libraryRef}
        name="library"
        type="file"
        accept={allowVideo ? LIBRARY_WITH_VIDEO : LIBRARY_IMAGES}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => take(e.target.files, e.currentTarget)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className={btn}
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-4 w-4 shrink-0" aria-hidden />
          {cameraLabel}
        </button>
        <button
          type="button"
          className={btn}
          disabled={disabled}
          onClick={() => libraryRef.current?.click()}
        >
          <Images className="h-4 w-4 shrink-0" aria-hidden />
          {libraryLabel}
        </button>
      </div>
      {hint ? (
        <p className={tone === 'dark' ? 'text-xs text-white/45' : 'text-xs text-muted'}>{hint}</p>
      ) : null}
    </div>
  );
}
