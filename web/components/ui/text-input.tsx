"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";
import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-xl border bg-surface/70 px-4 text-text-primary placeholder:text-text-disabled transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "h-12 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary",
        code: "h-12 border-white/10 text-center font-mono text-lg tracking-[0.5em] uppercase focus:border-primary focus:ring-1 focus:ring-primary",
      },
      state: {
        default: "",
        success: "border-success/60 focus:border-success focus:ring-success",
        error: "border-danger/60 focus:border-danger focus:ring-danger",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

export interface TextInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix">,
    VariantProps<typeof inputVariants> {
  label?: string;
  icon?: string;
  trailingIcon?: string;
  helperText?: string;
  errorText?: string;
  showCounter?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      icon,
      trailingIcon,
      className,
      variant,
      state,
      helperText,
      errorText,
      maxLength,
      showCounter = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(errorText);
    const resolvedState = hasError ? "error" : state;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full space-y-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          {icon ? (
            <Icon
              name={icon}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              variant="round"
            />
          ) : null}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            value={value}
            onChange={(event) => {
              if (variant === "code") {
                event.target.value = event.target.value.toUpperCase();
              }
              onChange?.(event);
            }}
            maxLength={maxLength}
            className={cn(
              inputVariants({ variant, state: resolvedState }),
              icon && "ps-10",
              trailingIcon && "pe-10",
              className
            )}
            {...props}
          />

          {trailingIcon ? (
            <Icon
              name={trailingIcon}
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              variant="round"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className={cn(hasError ? "text-danger" : "text-text-muted")}>
            {hasError ? errorText : helperText}
          </span>
          {showCounter && maxLength ? (
            <span className="text-text-muted tabular-nums">
              {currentLength}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
