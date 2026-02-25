import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  className,
  label,
  error,
  success,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id || React.useId();

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-all duration-200",
            "border-white/10 focus:border-blue-500/50 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/20",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
            success && "border-teal-500/50 focus:border-teal-500 focus:ring-teal-500/20",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />

        {rightIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        ) : error ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="h-4 w-4" />
          </div>
        ) : success ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      
      {error && (
        <p className="text-xs text-red-400 pl-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
