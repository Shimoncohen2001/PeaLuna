'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/media/camera-capture';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { normalizeMediaMime } from '@/lib/media-file';

type Pending = { id: string; name: string; preview: string; kind: 'image' | 'video' };

export function BookingMediaStep({ wigId, onSkip }: { wigId: string; onSkip: () => void }) {
  const { authFetch } = useAuth();
  const { t } = useLocale();
  const [files, setFiles] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(list: File[] | FileList | null) {
    if (!list || !wigId) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(list)) {
        const mimeType = normalizeMediaMime(file);
        const urlRes = await authFetch<{ uploadUrl: string; storageKey: string }>(
          '/api/v1/media/upload-url',
          {
            method: 'POST',
            body: JSON.stringify({
              wigId,
              mimeType,
              fileSizeBytes: file.size,
              purpose: 'INTAKE',
              filename: file.name,
            }),
          },
        );
        const put = await fetch(urlRes.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': mimeType },
          body: file,
        });
        if (!put.ok) throw new Error('Upload failed');
        await authFetch('/api/v1/media/confirm', {
          method: 'POST',
          body: JSON.stringify({
            storageKey: urlRes.storageKey,
            wigId,
            mimeType,
            fileSizeBytes: file.size,
            purpose: 'INTAKE',
          }),
        });
        setFiles((prev) => [
          ...prev,
          {
            id: urlRes.storageKey,
            name: file.name,
            preview: URL.createObjectURL(file),
            kind: mimeType.startsWith('video/') ? 'video' : 'image',
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-2xl text-ink">{t.book.mediaTitle}</h2>
        <span className="rounded-full bg-beige/70 px-2 py-0.5 text-xs text-muted">
          {t.book.mediaOptional}
        </span>
      </div>
      <p className="text-sm text-muted">{t.book.mediaHint}</p>
      <CameraCapture
        disabled={busy || !wigId}
        multiple
        allowVideo
        cameraLabel={t.book.takePhoto}
        libraryLabel={t.book.chooseLibrary}
        onPick={(picked) => void onPick(picked)}
      />
      {busy ? <p className="text-sm text-muted">{t.common.loading}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {files.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-lg border border-ink/10">
              {f.kind === 'video' ? (
                <video src={f.preview} className="h-28 w-full object-cover" muted />
              ) : (
                <img src={f.preview} alt={f.name} className="h-28 w-full object-cover" />
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <Button type="button" variant="secondary" disabled={busy} onClick={onSkip}>
        {t.book.skip}
      </Button>
    </div>
  );
}
