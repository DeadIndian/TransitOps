// Brutalist card: bordered slab with a hard offset shadow (plan §4).
export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[var(--surface)] border-[3px] border-ink rounded-[4px] shadow-brutal p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
