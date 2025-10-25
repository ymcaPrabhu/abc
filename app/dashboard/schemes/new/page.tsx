"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Ministry, Department, SchemeType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import {
  Button,
  Input,
  Select,
  Textarea,
  FormField,
  Card,
  useToast,
} from "@/components/ui";

interface FormData {
  name: string;
  code: string;
  ministry_id: string;
  department_id: string;
  scheme_type: SchemeType;
  description: string;
  objectives: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function NewSchemePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    ministry_id: "",
    department_id: "",
    scheme_type: "Central Sector",
    description: "",
    objectives: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingMinistries, setLoadingMinistries] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Check authorization
  useEffect(() => {
    if (profile && !canCreateBudgetProposal(profile)) {
      toast.error("You don't have permission to create schemes");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  // Fetch ministries
  useEffect(() => {
    fetchMinistries();
  }, []);

  // Fetch departments when ministry changes
  useEffect(() => {
    if (formData.ministry_id) {
      fetchDepartments(formData.ministry_id);
    } else {
      setDepartments([]);
    }
  }, [formData.ministry_id]);

  const fetchMinistries = async () => {
    try {
      setLoadingMinistries(true);
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setMinistries(data || []);
    } catch (error: any) {
      console.error("Error fetching ministries:", error);
      toast.error("Failed to fetch ministries");
    } finally {
      setLoadingMinistries(false);
    }
  };

  const fetchDepartments = async (ministryId: string) => {
    try {
      setLoadingDepartments(true);
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("ministry_id", ministryId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Reset department when ministry changes
      if (field === "ministry_id") {
        updated.department_id = "";
      }

      return updated;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Scheme name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Scheme name must be at least 3 characters";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Scheme code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = "Code must contain only uppercase letters, numbers, hyphens, and underscores";
    } else if (formData.code.length < 2 || formData.code.length > 20) {
      newErrors.code = "Code must be between 2 and 20 characters";
    }

    if (!formData.ministry_id) {
      newErrors.ministry_id = "Ministry is required";
    }

    if (!formData.scheme_type) {
      newErrors.scheme_type = "Scheme type is required";
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      // Check if code already exists
      const { data: existingScheme, error: checkError } = await supabase
        .from("schemes")
        .select("id")
        .eq("code", formData.code.toUpperCase())
        .single();

      if (existingScheme) {
        setErrors({ code: "This scheme code already exists" });
        toast.error("Scheme code already exists");
        return;
      }

      // Create scheme
      const { error } = await supabase.from("schemes").insert([
        {
          ...formData,
          code: formData.code.toUpperCase(),
          department_id: formData.department_id || null,
          description: formData.description || null,
          objectives: formData.objectives || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          created_by: profile?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Scheme created successfully");
      router.push("/dashboard/schemes");
    } catch (error: any) {
      console.error("Error creating scheme:", error);
      toast.error(error.message || "Failed to create scheme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schemes
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Scheme</h1>
        <p className="text-gray-600 mt-1">
          Create a new government scheme or program
        </p>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Scheme Name"
                htmlFor="name"
                required
                error={errors.name}
                hint="Full official name of the scheme"
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Pradhan Mantri Awas Yojana"
                  error={errors.name}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Scheme Code"
                htmlFor="code"
                required
                error={errors.code}
                hint="Unique code (uppercase only)"
              >
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                  placeholder="e.g., PMAY"
                  error={errors.code}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Ministry"
                htmlFor="ministry_id"
                required
                error={errors.ministry_id}
              >
                <Select
                  id="ministry_id"
                  value={formData.ministry_id}
                  onChange={(e) => handleChange("ministry_id", e.target.value)}
                  options={[
                    { value: "", label: "Select Ministry" },
                    ...ministries.map((m) => ({
                      value: m.id,
                      label: m.name,
                    })),
                  ]}
                  error={errors.ministry_id}
                  disabled={loading || loadingMinistries}
                />
              </FormField>

              <FormField
                label="Department"
                htmlFor="department_id"
                hint="Optional - select if scheme is department-specific"
              >
                <Select
                  id="department_id"
                  value={formData.department_id}
                  onChange={(e) => handleChange("department_id", e.target.value)}
                  options={[
                    { value: "", label: "Select Department (Optional)" },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: d.name,
                    })),
                  ]}
                  disabled={loading || loadingDepartments || !formData.ministry_id}
                />
              </FormField>

              <FormField
                label="Scheme Type"
                htmlFor="scheme_type"
                required
                error={errors.scheme_type}
              >
                <Select
                  id="scheme_type"
                  value={formData.scheme_type}
                  onChange={(e) => handleChange("scheme_type", e.target.value as SchemeType)}
                  options={[
                    { value: "Central Sector", label: "Central Sector" },
                    { value: "Centrally Sponsored", label: "Centrally Sponsored" },
                    { value: "State Sector", label: "State Sector" },
                    { value: "Other", label: "Other" },
                  ]}
                  error={errors.scheme_type}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Active Status"
                htmlFor="is_active"
              >
                <Select
                  id="is_active"
                  value={formData.is_active.toString()}
                  onChange={(e) => handleChange("is_active", e.target.value === "true")}
                  options={[
                    { value: "true", label: "Active" },
                    { value: "false", label: "Inactive" },
                  ]}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Description and Objectives */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Description and Objectives
            </h2>
            <div className="space-y-4">
              <FormField
                label="Description"
                htmlFor="description"
                hint="Brief description of the scheme"
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter scheme description..."
                  rows={4}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Objectives"
                htmlFor="objectives"
                hint="Main objectives and goals of the scheme"
              >
                <Textarea
                  id="objectives"
                  value={formData.objectives}
                  onChange={(e) => handleChange("objectives", e.target.value)}
                  placeholder="Enter scheme objectives..."
                  rows={4}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                htmlFor="start_date"
                hint="When the scheme begins"
              >
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="End Date"
                htmlFor="end_date"
                error={errors.end_date}
                hint="When the scheme ends (if applicable)"
              >
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  error={errors.end_date}
                  disabled={loading}
                  min={formData.start_date || undefined}
                />
              </FormField>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} disabled={loading}>
              Create Scheme
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
