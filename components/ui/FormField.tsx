import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
  hint,
}: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
