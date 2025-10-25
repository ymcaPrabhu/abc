"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Ministry, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  Input,
  Select,
  Textarea,
  FormField,
  Card,
  LoadingSpinner,
  useToast,
} from "@/components/ui";

interface FormData {
  name: string;
  code: string;
  ministry_id: string;
  description: string;
  head_name: string;
  head_email: string;
  head_phone: string;
  is_active: boolean;
}

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const departmentId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    ministry_id: "",
    description: "",
    head_name: "",
    head_email: "",
    head_phone: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loadingMinistries, setLoadingMinistries] = useState(true);
  const [originalCode, setOriginalCode] = useState("");

  // Check authorization
  useEffect(() => {
    if (profile && !isAdmin(profile)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  // Fetch department data
  useEffect(() => {
    if (departmentId) {
      fetchDepartment();
    }
  }, [departmentId]);

  // Fetch ministries
  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchDepartment = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", departmentId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Department not found");
        router.push("/dashboard/admin/departments");
        return;
      }

      setFormData({
        name: data.name || "",
        code: data.code || "",
        ministry_id: data.ministry_id || "",
        description: data.description || "",
        head_name: data.head_name || "",
        head_email: data.head_email || "",
        head_phone: data.head_phone || "",
        is_active: data.is_active ?? true,
      });
      setOriginalCode(data.code || "");
    } catch (error: any) {
      console.error("Error fetching department:", error);
      toast.error(error.message || "Failed to fetch department");
      router.push("/dashboard/admin/departments");
    } finally {
      setLoadingData(false);
    }
  };

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

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      newErrors.name = "Department name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Department name must be at least 3 characters";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Department code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = "Code must contain only uppercase letters, numbers, hyphens, and underscores";
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      newErrors.code = "Code must be between 2 and 10 characters";
    }

    if (!formData.ministry_id) {
      newErrors.ministry_id = "Ministry is required";
    }

    // Optional but validated fields
    if (formData.head_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.head_email)) {
      newErrors.head_email = "Invalid email format";
    }

    if (formData.head_phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.head_phone)) {
      newErrors.head_phone = "Invalid phone number format";
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

      // Check if code already exists (if changed)
      if (formData.code.toUpperCase() !== originalCode) {
        const { data: existingDept, error: checkError } = await supabase
          .from("departments")
          .select("id")
          .eq("code", formData.code.toUpperCase())
          .neq("id", departmentId)
          .single();

        if (existingDept) {
          setErrors({ code: "This department code already exists" });
          toast.error("Department code already exists");
          return;
        }
      }

      // Update department
      const { error } = await supabase
        .from("departments")
        .update({
          ...formData,
          code: formData.code.toUpperCase(),
        })
        .eq("id", departmentId);

      if (error) throw error;

      toast.success("Department updated successfully");
      router.push("/dashboard/admin/departments");
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast.error(error.message || "Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !isAdmin(profile)) {
    return null;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Department</h1>
        <p className="text-gray-600 mt-1">
          Update department information
        </p>
      </div>

      {/* Form */}
      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <FormField
                label="Department Name"
                htmlFor="name"
                required
                error={errors.name}
                hint="Full official name of the department"
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Department of Economic Affairs"
                  error={errors.name}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Department Code"
                htmlFor="code"
                required
                error={errors.code}
                hint="Unique code (uppercase letters, numbers, hyphens, underscores only)"
              >
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                  placeholder="e.g., DEA"
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
                label="Description"
                htmlFor="description"
                hint="Brief description of the department's role and responsibilities"
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter department description..."
                  rows={4}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Department Head Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Department Head (Optional)
            </h2>
            <div className="space-y-4">
              <FormField
                label="Head Name"
                htmlFor="head_name"
                hint="Name of the department head"
              >
                <Input
                  id="head_name"
                  value={formData.head_name}
                  onChange={(e) => handleChange("head_name", e.target.value)}
                  placeholder="e.g., Dr. Rajesh Kumar"
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Head Email"
                htmlFor="head_email"
                error={errors.head_email}
                hint="Official email address"
              >
                <Input
                  id="head_email"
                  type="email"
                  value={formData.head_email}
                  onChange={(e) => handleChange("head_email", e.target.value)}
                  placeholder="e.g., head@department.gov.in"
                  error={errors.head_email}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Head Phone"
                htmlFor="head_phone"
                error={errors.head_phone}
                hint="Contact phone number"
              >
                <Input
                  id="head_phone"
                  type="tel"
                  value={formData.head_phone}
                  onChange={(e) => handleChange("head_phone", e.target.value)}
                  placeholder="e.g., +91 11 2345 6789"
                  error={errors.head_phone}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <FormField
              label="Active Status"
              htmlFor="is_active"
              hint="Inactive departments cannot be used for new schemes or budgets"
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
              Update Department
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
