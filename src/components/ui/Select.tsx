import { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

// Brutalist select — matches Input's border/focus treatment (plan §6).
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className = "", id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`bg-[var(--surface)] text-[var(--fg)] border-2 border-ink rounded-[4px] px-3 py-2 font-comic
          focus:outline-none focus:shadow-[inset_3px_3px_0_var(--color-brand)]
          ${error ? "border-red" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="font-mono text-[11px] text-red">{error}</span>}
    </div>
  );
});
