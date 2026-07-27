export function AlunoAvatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, border: '1px solid var(--border)' }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(160,0,24,0.2)] text-sm font-semibold text-[var(--gold)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}
