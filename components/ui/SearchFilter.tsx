"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface FilterOption {
  label: string;
  value: string;
  type: "select" | "date" | "text";
  options?: { value: string; label: string }[];
}

export interface SearchFilterProps {
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onFilterChange?: (filters: Record<string, string>) => void;
  className?: string;
}

export function SearchFilter({
  onSearch,
  searchPlaceholder = "Search...",
  filters = [],
  onFilterChange,
  className,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);

    // Count active filters
    const count = Object.values(newFilters).filter((v) => v !== "").length;
    setActiveFiltersCount(count);

    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setFilterValues({});
    setActiveFiltersCount(0);
    onFilterChange?.({});
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchQuery ? (
                <button onClick={clearSearch}>
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              ) : undefined
            }
          />
        </div>

        {filters.length > 0 && (
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(filterValues)
            .filter(([_, value]) => value !== "")
            .map(([key, value]) => {
              const filter = filters.find((f) => f.value === key);
              const label = filter?.options?.find((o) => o.value === value)?.label || value;

              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  <span className="font-medium">{filter?.label}:</span>
                  <span>{label}</span>
                  <button
                    onClick={() => handleFilterChange(key, "")}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        size="md"
      >
        <div className="space-y-4">
          {filters.map((filter) => (
            <div key={filter.value}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filter.label}
              </label>

              {filter.type === "select" && filter.options && (
                <Select
                  value={filterValues[filter.value] || ""}
                  onChange={(e) => handleFilterChange(filter.value, e.target.value)}
                  options={[{ value: "", label: "All" }, ...filter.options]}
                />
              )}

              {filter.type === "text" && (
                <Input
                  value={filterValues[filter.value] || ""}
                  onChange={(e) => handleFilterChange(filter.value, e.target.value)}
                  placeholder={`Enter ${filter.label.toLowerCase()}`}
                />
              )}

              {filter.type === "date" && (
                <Input
                  type="date"
                  value={filterValues[filter.value] || ""}
                  onChange={(e) => handleFilterChange(filter.value, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={clearFilters} variant="outline" fullWidth>
              Clear All
            </Button>
            <Button onClick={() => setShowFilters(false)} fullWidth>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
