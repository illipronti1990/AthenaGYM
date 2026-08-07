'use client';

export function DenialReasonBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      data-testid="denial-reason"
      role="alert"
    >
      {message}
    </div>
  );
}
