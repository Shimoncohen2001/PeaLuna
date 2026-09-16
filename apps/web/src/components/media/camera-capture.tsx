'use client';

import { useId } from 'react';
import { Camera, Images } from 'lucide-react';

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

  function take(input: HTMLInputElement) {
    const list = input.files;
    if (!list?.length) return;
    onPick(Array.from(list));
    input.value = '';
  }

  // Safari iOS only opens the picker when the tap lands on the input itself,
  // so each input covers its label instead of being clicked from JavaScript.
  const label =
    tone === 'dark'
      ? 'relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/10 px-3 text-sm text-[#f7efe8] active:bg-white/20'
      : 'relative inline-flex min-h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-ink/10 bg-warm-white px-3 text-sm text-ink active:bg-beige/60';
  const labelClass = disabled ? `${label} pointer-events-none opacity-50` : label;
  const inputClass =
    'absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor={`${id}-camera`} className={labelClass}>
          <Camera className="h-4 w-4 shrink-0" aria-hidden />
          {cameraLabel}
          <input
            id={`${id}-camera`}
            name="camera"
            type="file"
            accept="image/*"
            capture="environment"
            className={inputClass}
            disabled={disabled}
            onChange={(e) => take(e.currentTarget)}
          />
        </label>
        <label htmlFor={`${id}-library`} className={labelClass}>
          <Images className="h-4 w-4 shrink-0" aria-hidden />
          {libraryLabel}
          <input
            id={`${id}-library`}
            name="library"
            type="file"
            accept={allowVideo ? 'image/*,video/*' : 'image/*'}
            multiple={multiple}
            className={inputClass}
            disabled={disabled}
            onChange={(e) => take(e.currentTarget)}
          />
        </label>
      </div>
      {hint ? (
        <p className={tone === 'dark' ? 'text-xs text-white/45' : 'text-xs text-muted'}>{hint}</p>
      ) : null}
    </div>
  );
}
