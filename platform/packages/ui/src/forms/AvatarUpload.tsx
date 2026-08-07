'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Camera } from 'lucide-react';

export function AvatarUpload({
  label = 'Foto',
  valueUrl,
  onFile,
}: {
  label?: ReactNode;
  valueUrl?: string | null;
  onFile: (file: File, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState<string | null>(valueUrl || null);

  function pick(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setZoom(1);
    setRotation(0);
    onFile(file, url);
  }

  return (
    <div className="movvo-field" data-testid="avatar-upload">
      {label ? <span className="movvo-label">{label}</span> : null}
      <div className="movvo-avatar-upload">
        <button
          type="button"
          className="movvo-avatar-preview"
          onClick={() => inputRef.current?.click()}
          aria-label="Selecionar foto"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          ) : (
            <Camera size={28} />
          )}
        </button>
        <div className="movvo-avatar-controls">
          <label className="text-xs text-[var(--muted)]">
            Zoom
            <input
              type="range"
              min={1}
              max={2}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-[var(--muted)]">
            Rotação
            <input
              type="range"
              min={0}
              max={360}
              step={15}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </label>
          <button type="button" className="movvo-btn movvo-btn-secondary movvo-btn-sm" onClick={() => inputRef.current?.click()}>
            Escolher imagem
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
          }}
        />
      </div>
    </div>
  );
}
