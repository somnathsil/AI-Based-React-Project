import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      as: Component = "button",
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "cursor-pointer inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 focus:ring-sky-500 border border-sky-400/20",
      secondary:
        "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 focus:ring-slate-500",
      outline:
        "bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700 focus:ring-slate-500 hover:border-slate-600",
      ghost:
        "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-500",
      danger:
        "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500",
    };

    const sizes = {
      sm: "text-md px-3 py-1.5 gap-1.5",
      md: "text-base px-4 py-2.5 gap-2",
      lg: "text-lg px-6 py-3 gap-2.5",
    };

    const isButton = Component === "button";

    return (
      <Component
        ref={ref}
        type={isButton ? type : undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isButton ? disabled || isLoading : undefined}
        aria-disabled={!isButton && (disabled || isLoading) ? true : undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
