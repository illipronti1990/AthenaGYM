'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { ProgressIndicator } from '../feedback/ProgressIndicator';

export type UploadItem = {
  id: string;
  file: File;
  previewUrl?: string;
  progress?: number;
  status?: 'ready' | 'uploading' | 'done' | 'error';
};

const DEFAULT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.docx,image/*';

export function FileUploader({
  label = 'Arquivos',
  accept = DEFAULT_ACCEPT,
  multiple = true,
  maxSizeMb = 10,
  value,
  onChange,
  onUpload,
  pasteEnabled = true,
}: {
  label?: ReactNode;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  value: UploadItem[];
  onChange: (items: UploadItem[]) => void;
  onUpload?: (item: UploadItem) => Promise<void>;
  pasteEnabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const next: UploadItem[] = [];
      for (const file of list) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          setError(`Arquivo acima de ${maxSizeMb} MB: ${file.name}`);
          continue;
        }
        const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        next.push({ id, file, previewUrl, status: 'ready', progress: 0 });
      }
      if (!next.length) return;
      setError(null);
      const merged = multiple ? [...value, ...next] : next.slice(0, 1);
      onChange(merged);
      if (onUpload) {
        for (const item of next) {
          void (async () => {
            try {
              onChange(
                (multiple ? [...value, ...next] : next).map((x) =>
                  x.id === item.id ? { ...x, status: 'uploading', progress: 35 } : x,
                ),
              );
              await onUpload(item);
            } catch {
              /* parent handles toast */
            }
          })();
        }
      }
    },
    [maxSizeMb, multiple, onChange, onUpload, value],
  );

  useEffect(() => {
    if (!pasteEnabled) return;
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (files?.length) addFiles(files);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, pasteEnabled]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function remove(id: string) {
    const item = value.find((v) => v.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(value.filter((v) => v.id !== id));
  }

  return (
    <div className="athena-field" data-testid="file-uploader">
      {label ? <span className="athena-label">{label}</span> : null}
      <div
        className={`athena-dropzone ${dragOver ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <Upload size={22} aria-hidden />
        <p>Arraste aqui, selecione ou cole (Ctrl+V)</p>
        <p className="athena-muted text-xs">PDF, JPG, PNG, DOCX · até {maxSizeMb} MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error ? <p className="athena-field-hint is-error mt-2">❌ {error}</p> : null}
      {value.length ? (
        <ul className="athena-upload-list">
          {value.map((item) => (
            <li key={item.id} className="athena-upload-item">
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="athena-upload-thumb" />
              ) : (
                <FileText size={20} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.file.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  {item.status === 'done' ? ' · ✔' : ''}
                </p>
                {item.status === 'uploading' ? (
                  <ProgressIndicator value={item.progress || 50} />
                ) : null}
              </div>
              <button type="button" className="athena-icon-btn" onClick={() => remove(item.id)} aria-label="Remover">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ImageUploader(props: Omit<Parameters<typeof FileUploader>[0], 'accept'>) {
  return <FileUploader {...props} accept="image/png,image/jpeg,image/jpg,image/webp" />;
}
