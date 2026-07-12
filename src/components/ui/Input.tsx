import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Brutalist input: 2px border, inset-shadow focus, mono error below (plan §6).
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`bg-[var(--surface)] text-[var(--fg)] border-2 border-ink rounded-[4px] px-3 py-2 font-comic
          focus:outline-none focus:shadow-[inset_3px_3px_0_var(--color-brand)]
          ${error ? "border-red shadow-[inset_3px_3px_0_#EF4444]" : ""} ${className}`}
        {...props}
      />
      {error && <span className="font-mono text-[11px] text-red">{error}</span>}
    </div>
  );
});
