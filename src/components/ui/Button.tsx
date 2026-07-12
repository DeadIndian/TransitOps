import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-ink",
  secondary: "bg-[var(--surface)] text-[var(--fg)]",
  danger: "bg-red text-white",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-[18px] py-[10px]",
  lg: "px-6 py-3 text-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Brutalist button: thick border, hard offset shadow, press-to-slam (plan §4).
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 border-[3px] border-ink rounded-[4px] font-comic font-bold
        shadow-brutal transition-[transform,box-shadow] duration-75 ease-out
        hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-lg
        active:translate-x-1 active:translate-y-1 active:shadow-none
        focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-pop-blue focus-visible:outline-offset-[3px]
        disabled:bg-grey disabled:text-[#4b4b4b] disabled:border-dashed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
