export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <path d="M42 20.5c-2.6-2.4-6.1-3.6-10.2-3.6-6.4 0-10.6 3.3-10.6 8.1 0 4.6 3.4 6.6 9.4 7.9 4.3.9 5.6 1.8 5.6 3.4 0 1.8-1.9 3-4.9 3-3.4 0-6.1-1.3-8.2-3.6" fill="none" className="stroke-primary-foreground" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 41v8m-4.5-4.5L32 49l4.5-4.5" fill="none" className="stroke-primary-foreground" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">SAVORA</span>
    </span>
  );
}
