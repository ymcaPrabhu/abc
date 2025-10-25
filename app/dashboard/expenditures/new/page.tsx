"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, BudgetType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canRecordExpenditure } from "@/lib/utils/authorization";
import { getCurrentFinancialYear } from "@/lib/utils/formatters";
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
  scheme_id: string;
  financial_year: string;
  month: number;
  amount: number;
  expenditure_type: BudgetType;
  description: string;
  transaction_date: string;
  voucher_number: string;
}

export default function NewExpenditurePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<FormData>({
    scheme_id: "",
    financial_year: getCurrentFinancialYear(),
    month: new Date().getMonth() + 1,
    amount: 0,
    expenditure_type: "Revenue",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
    voucher_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  useEffect(() => {
    if (profile && !canRecordExpenditure(profile)) {
      toast.error("You don't have permission to record expenditures");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoadingSchemes(true);
      let query = supabase
        .from("schemes")
        .select("*, ministry:ministries(id, name), department:departments(id, name)")
        .eq("is_active", true)
        .order("name");

      if (profile?.ministry_id) {
        query = query.eq("ministry_id", profile.ministry_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSchemes(data || []);
    } catch (error: any) {
      console.error("Error fetching schemes:", error);
      toast.error("Failed to fetch schemes");
    } finally {
      setLoadingSchemes(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.scheme_id) newErrors.scheme_id = "Scheme is required";
    if (!formData.voucher_number.trim()) newErrors.voucher_number = "Voucher number is required";
    if (!formData.amount || formData.amount <= 0) newErrors.amount = "Valid amount is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.transaction_date) newErrors.transaction_date = "Transaction date is required";

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

      const selectedScheme = schemes.find((s) => s.id === formData.scheme_id);

      const { error } = await supabase.from("expenditures").insert([
        {
          ...formData,
          ministry_id: selectedScheme?.ministry_id,
          department_id: selectedScheme?.department_id,
          created_by: profile?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Expenditure recorded successfully");
      router.push("/dashboard/expenditures");
    } catch (error: any) {
      console.error("Error recording expenditure:", error);
      toast.error(error.message || "Failed to record expenditure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenditures
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Record Expenditure</h1>
        <p className="text-gray-600 mt-1">Record a new budget expenditure</p>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Scheme" required error={errors.scheme_id}>
              <Select
                value={formData.scheme_id}
                onChange={(e) => handleChange("scheme_id", e.target.value)}
                options={[
                  { value: "", label: "Select Scheme" },
                  ...schemes.map((s) => ({ value: s.id, label: s.name })),
                ]}
                error={errors.scheme_id}
                disabled={loading || loadingSchemes}
              />
            </FormField>

            <FormField label="Financial Year" required>
              <Select
                value={formData.financial_year}
                onChange={(e) => handleChange("financial_year", e.target.value)}
                options={[
                  { value: "2025-26", label: "FY 2025-26" },
                  { value: "2024-25", label: "FY 2024-25" },
                ]}
                disabled={loading}
              />
            </FormField>

            <FormField label="Month" required>
              <Select
                value={formData.month.toString()}
                onChange={(e) => handleChange("month", parseInt(e.target.value))}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: new Date(2000, i).toLocaleString("default", { month: "long" }),
                }))}
                disabled={loading}
              />
            </FormField>

            <FormField label="Expenditure Type" required>
              <Select
                value={formData.expenditure_type}
                onChange={(e) => handleChange("expenditure_type", e.target.value as BudgetType)}
                options={[
                  { value: "Capital", label: "Capital" },
                  { value: "Revenue", label: "Revenue" },
                  { value: "Administrative", label: "Administrative" },
                  { value: "Other", label: "Other" },
                ]}
                disabled={loading}
              />
            </FormField>

            <FormField label="Transaction Date" required error={errors.transaction_date}>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => handleChange("transaction_date", e.target.value)}
                error={errors.transaction_date}
                disabled={loading}
              />
            </FormField>

            <FormField label="Voucher Number" required error={errors.voucher_number}>
              <Input
                value={formData.voucher_number}
                onChange={(e) => handleChange("voucher_number", e.target.value)}
                placeholder="e.g., VCH-2025-001"
                error={errors.voucher_number}
                disabled={loading}
              />
            </FormField>

            <FormField label="Amount (₹)" required error={errors.amount}>
              <Input
                type="number"
                value={formData.amount || ""}
                onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                error={errors.amount}
                disabled={loading}
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description}>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the expenditure..."
              rows={4}
              error={errors.description}
              disabled={loading}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} disabled={loading}>
              Record Expenditure
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
