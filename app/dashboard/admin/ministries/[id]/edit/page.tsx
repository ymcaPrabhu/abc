"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Ministry } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  Card,
  LoadingSpinner,
  useToast,
} from "@/components/ui";

interface FormData {
  name: string;
  code: string;
  description: string;
  minister_name: string;
  minister_email: string;
  secretary_name: string;
  secretary_email: string;
  is_active: boolean;
}

export default function EditMinistryPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const ministryId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    description: "",
    minister_name: "",
    minister_email: "",
    secretary_name: "",
    secretary_email: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [originalCode, setOriginalCode] = useState("");

  // Check authorization
  useEffect(() => {
    if (profile && !isAdmin(profile)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  // Fetch ministry data
  useEffect(() => {
    if (ministryId) {
      fetchMinistry();
    }
  }, [ministryId]);

  const fetchMinistry = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .eq("id", ministryId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Ministry not found");
        router.push("/dashboard/admin/ministries");
        return;
      }

      setFormData({
        name: data.name || "",
        code: data.code || "",
        description: data.description || "",
        minister_name: data.minister_name || "",
        minister_email: data.minister_email || "",
        secretary_name: data.secretary_name || "",
        secretary_email: data.secretary_email || "",
        is_active: data.is_active ?? true,
      });
      setOriginalCode(data.code || "");
    } catch (error: any) {
      console.error("Error fetching ministry:", error);
      toast.error(error.message || "Failed to fetch ministry");
      router.push("/dashboard/admin/ministries");
    } finally {
      setLoadingData(false);
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
      newErrors.name = "Ministry name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Ministry name must be at least 3 characters";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Ministry code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = "Code must contain only uppercase letters, numbers, hyphens, and underscores";
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      newErrors.code = "Code must be between 2 and 10 characters";
    }

    // Optional but validated fields
    if (formData.minister_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.minister_email)) {
      newErrors.minister_email = "Invalid email format";
    }

    if (formData.secretary_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secretary_email)) {
      newErrors.secretary_email = "Invalid email format";
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
        const { data: existingMinistry, error: checkError } = await supabase
          .from("ministries")
          .select("id")
          .eq("code", formData.code.toUpperCase())
          .neq("id", ministryId)
          .single();

        if (existingMinistry) {
          setErrors({ code: "This ministry code already exists" });
          toast.error("Ministry code already exists");
          return;
        }
      }

      // Update ministry
      const { error } = await supabase
        .from("ministries")
        .update({
          ...formData,
          code: formData.code.toUpperCase(),
        })
        .eq("id", ministryId);

      if (error) throw error;

      toast.success("Ministry updated successfully");
      router.push("/dashboard/admin/ministries");
    } catch (error: any) {
      console.error("Error updating ministry:", error);
      toast.error(error.message || "Failed to update ministry");
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
          Back to Ministries
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Ministry</h1>
        <p className="text-gray-600 mt-1">
          Update ministry information
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
                label="Ministry Name"
                htmlFor="name"
                required
                error={errors.name}
                hint="Full official name of the ministry"
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Ministry of Finance"
                  error={errors.name}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Ministry Code"
                htmlFor="code"
                required
                error={errors.code}
                hint="Unique code (uppercase letters, numbers, hyphens, underscores only)"
              >
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                  placeholder="e.g., MoF"
                  error={errors.code}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                hint="Brief description of the ministry's role and responsibilities"
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter ministry description..."
                  rows={4}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Minister Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Minister Information (Optional)
            </h2>
            <div className="space-y-4">
              <FormField
                label="Minister Name"
                htmlFor="minister_name"
                hint="Name of the cabinet minister"
              >
                <Input
                  id="minister_name"
                  value={formData.minister_name}
                  onChange={(e) => handleChange("minister_name", e.target.value)}
                  placeholder="e.g., Smt. Nirmala Sitharaman"
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Minister Email"
                htmlFor="minister_email"
                error={errors.minister_email}
                hint="Official email address"
              >
                <Input
                  id="minister_email"
                  type="email"
                  value={formData.minister_email}
                  onChange={(e) => handleChange("minister_email", e.target.value)}
                  placeholder="e.g., minister@ministry.gov.in"
                  error={errors.minister_email}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Secretary Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Secretary Information (Optional)
            </h2>
            <div className="space-y-4">
              <FormField
                label="Secretary Name"
                htmlFor="secretary_name"
                hint="Name of the ministry secretary"
              >
                <Input
                  id="secretary_name"
                  value={formData.secretary_name}
                  onChange={(e) => handleChange("secretary_name", e.target.value)}
                  placeholder="e.g., Shri Ajay Seth"
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Secretary Email"
                htmlFor="secretary_email"
                error={errors.secretary_email}
                hint="Official email address"
              >
                <Input
                  id="secretary_email"
                  type="email"
                  value={formData.secretary_email}
                  onChange={(e) => handleChange("secretary_email", e.target.value)}
                  placeholder="e.g., secretary@ministry.gov.in"
                  error={errors.secretary_email}
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
              hint="Inactive ministries cannot be used for new departments or schemes"
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
              Update Ministry
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
