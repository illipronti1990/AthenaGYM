'use client';

import { useRef, useState } from 'react';
import type { StudentDocument } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { useToast } from '@/components/ui/Toast';
import { uploadAlunoDocument } from '../services/alunosApi';

const DOC_TYPES = [
  { value: 'contract', label: 'Contrato' },
  { value: 'rg', label: 'RG' },
  { value: 'cpf', label: 'CPF' },
  { value: 'medical', label: 'Atestado médico' },
  { value: 'liability', label: 'Termo de responsabilidade' },
  { value: 'other', label: 'Outro' },
] as const;

export function AlunoDocumentsPanel({
  accessToken,
  studentId,
  documents,
  onUploaded,
}: {
  accessToken: string;
  studentId: string;
  documents: StudentDocument[];
  onUploaded: () => void;
}) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('contract');
  const [uploading, setUploading] = useState(false);

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await uploadAlunoDocument(accessToken, studentId, file, docType);
      push('Documento enviado.');
      onUploaded();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no upload', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4" data-testid="student-documents">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select
              className="movvo-input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => void onFileChange(e.target.files?.[0])}
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Enviando…' : 'Anexar documento'}
          </Button>
        </div>
      </Card>

      {documents.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum documento anexado.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => {
            const label =
              DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type;
            const previewUrl = doc.storagePath.startsWith('http')
              ? doc.storagePath
              : undefined;
            return (
              <li
                key={doc.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <p className="text-sm font-medium text-[var(--text)]">{label}</p>
                <p className="text-xs text-[var(--muted)]">
                  {doc.fileName || 'arquivo'} ·{' '}
                  {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                </p>
                {previewUrl && /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName || '') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={doc.fileName || label}
                    className="mt-2 max-h-32 rounded border border-[var(--border)] object-cover"
                  />
                ) : null}
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-[var(--gold)] hover:underline"
                  >
                    Abrir / preview
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-[var(--muted)]">{doc.storagePath}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
