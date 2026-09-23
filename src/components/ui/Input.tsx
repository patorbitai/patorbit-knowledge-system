import { forwardRef } from "react";
import clsx from "clsx";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

const FIELD_CLASSES =
  "w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-body text-ink " +
  "placeholder:text-ink-muted transition-colors " +
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-danger";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Canonical text input. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={clsx(FIELD_CLASSES, className)} {...props} />;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Canonical multiline input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(FIELD_CLASSES, "min-h-24 resize-y", className)}
        {...props}
      />
    );
  }
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Canonical select. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={clsx(FIELD_CLASSES, className)} {...props}>
        {children}
      </select>
    );
  }
);

/** Label + control + help/error text wrapper. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-label text-ink-secondary flex items-center gap-1"
      >
        {label}
        {required && (
          <span aria-hidden className="text-danger">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-meta text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-meta text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default Input;
