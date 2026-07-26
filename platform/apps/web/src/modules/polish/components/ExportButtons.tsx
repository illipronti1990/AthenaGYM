'use client';

import { polishApi } from '@/modules/polish/services/polishApi';

export function ExportButtons({
  accessToken,
  resource,
}: {
  accessToken: string;
  resource: 'students' | 'receivables' | 'checkins';
}) {
  function download(format: 'csv' | 'xlsx' | 'pdf') {
    const url = polishApi.exportUrl(resource, format);
    void (async () => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${resource}.${format === 'xlsx' ? 'xlsx' : format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    })();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(['csv', 'xlsx', 'pdf'] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => download(f)}
          className="athena-btn athena-btn-ghost !px-2 !py-1 text-xs uppercase"
        >
          {f}
        </button>
      ))}
    </div>
  );
}
