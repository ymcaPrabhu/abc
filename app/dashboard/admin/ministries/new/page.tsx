"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, FormField, Card, useToast } from "@/components/ui";

export default function NewMinistryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    minister_name: "",
    secretary_name: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Ministry name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Ministry code is required";
    } else if (formData.code.length > 10) {
      newErrors.code = "Code must be 10 characters or less";
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

    setLoading(true);

    try {
      const { error } = await supabase.from("ministries").insert([
        {
          ...formData,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Ministry created successfully");
      router.push("/dashboard/admin/ministries");
    } catch (error: any) {
      console.error("Error creating ministry:", error);
      toast.error(error.message || "Failed to create ministry");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Ministry</h1>
        <p className="text-gray-600 mt-1">Create a new government ministry</p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Ministry Name"
            htmlFor="name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Ministry of Finance"
              error={errors.name}
            />
          </FormField>

          <FormField
            label="Ministry Code"
            htmlFor="code"
            required
            error={errors.code}
            hint="Short code for the ministry (max 10 characters)"
          >
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="e.g., FIN"
              maxLength={10}
              error={errors.code}
            />
          </FormField>

          <FormField
            label="Minister Name"
            htmlFor="minister_name"
            hint="Name of the current minister"
          >
            <Input
              id="minister_name"
              value={formData.minister_name}
              onChange={(e) => handleChange("minister_name", e.target.value)}
              placeholder="e.g., Shri Rajesh Kumar"
            />
          </FormField>

          <FormField
            label="Secretary Name"
            htmlFor="secretary_name"
            hint="Name of the ministry secretary"
          >
            <Input
              id="secretary_name"
              value={formData.secretary_name}
              onChange={(e) => handleChange("secretary_name", e.target.value)}
              placeholder="e.g., Smt. Priya Sharma"
            />
          </FormField>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              Active (ministry is currently operational)
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" isLoading={loading} fullWidth>
              Create Ministry
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
