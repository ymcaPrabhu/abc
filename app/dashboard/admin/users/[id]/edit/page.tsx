"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserRole, Ministry, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  Input,
  Select,
  FormField,
  Card,
  LoadingSpinner,
  useToast,
} from "@/components/ui";

interface FormData {
  full_name: string;
  role: UserRole;
  ministry_id: string;
  department_id: string;
  is_active: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const userId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    role: "Section Officer",
    ministry_id: "",
    department_id: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (profile && !isAdmin(profile)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  useEffect(() => {
    fetchMinistries();
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  useEffect(() => {
    if (formData.ministry_id) {
      fetchDepartments(formData.ministry_id);
    } else {
      setDepartments([]);
    }
  }, [formData.ministry_id]);

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setMinistries(data || []);
    } catch (error: any) {
      console.error("Error fetching ministries:", error);
    }
  };

  const fetchDepartments = async (ministryId: string) => {
    try {
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
    }
  };

  const fetchUser = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("User not found");
        router.push("/dashboard/admin/users");
        return;
      }

      setFormData({
        full_name: data.full_name || "",
        role: data.role,
        ministry_id: data.ministry_id || "",
        department_id: data.department_id || "",
        is_active: data.is_active,
      });
      setUserEmail(data.email);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      toast.error(error.message || "Failed to fetch user");
      router.push("/dashboard/admin/users");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "ministry_id" && value !== prev.ministry_id) {
        updated.department_id = "";
      }
      return updated;
    });

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

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    // Role-based validation
    if (["Ministry Secretary", "Department Head"].includes(formData.role) && !formData.ministry_id) {
      newErrors.ministry_id = "Ministry is required for this role";
    }

    if (formData.role === "Department Head" && !formData.department_id) {
      newErrors.department_id = "Department is required for Department Head role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix all errors");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          ministry_id: formData.ministry_id || null,
          department_id: formData.department_id || null,
          is_active: formData.is_active,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("User updated successfully");
      router.push("/dashboard/admin/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-1">Update user role and assignments</p>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Email:</span> {userEmail}
            </p>
          </div>

          <FormField label="Full Name" required error={errors.full_name}>
            <Input
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Enter full name"
              error={errors.full_name}
              disabled={loading}
            />
          </FormField>

          <FormField label="Role" required hint="User's role in the system">
            <Select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value as UserRole)}
              options={[
                { value: "Finance Ministry Admin", label: "Finance Ministry Admin" },
                { value: "Budget Division Officer", label: "Budget Division Officer" },
                { value: "Ministry Secretary", label: "Ministry Secretary" },
                { value: "Department Head", label: "Department Head" },
                { value: "Section Officer", label: "Section Officer" },
                { value: "Auditor", label: "Auditor" },
              ]}
              disabled={loading}
            />
          </FormField>

          <FormField label="Ministry" error={errors.ministry_id} hint="Required for Ministry Secretary and Department Head roles">
            <Select
              value={formData.ministry_id}
              onChange={(e) => handleChange("ministry_id", e.target.value)}
              options={[
                { value: "", label: "Select Ministry (Optional)" },
                ...ministries.map((m) => ({ value: m.id, label: m.name })),
              ]}
              error={errors.ministry_id}
              disabled={loading}
            />
          </FormField>

          <FormField label="Department" error={errors.department_id} hint="Required for Department Head role">
            <Select
              value={formData.department_id}
              onChange={(e) => handleChange("department_id", e.target.value)}
              options={[
                { value: "", label: "Select Department (Optional)" },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              error={errors.department_id}
              disabled={loading || !formData.ministry_id}
            />
          </FormField>

          <FormField label="Status" hint="Inactive users cannot access the system">
            <Select
              value={formData.is_active.toString()}
              onChange={(e) => handleChange("is_active", e.target.value === "true")}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              disabled={loading}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} disabled={loading}>
              Update User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
