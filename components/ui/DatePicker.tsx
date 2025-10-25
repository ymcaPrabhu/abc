"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  error,
  disabled,
  min,
  max,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2 pr-10 border rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Calendar className="h-4 w-4 text-gray-400" />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = "Start date",
  endPlaceholder = "End date",
  error,
  disabled,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        max={endDate}
        error={error}
      />
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        min={startDate}
      />
    </div>
  );
}
