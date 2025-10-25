"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, ProposalType, BudgetType, BudgetLineItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import { formatINR } from "@/lib/utils/formatters";
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

interface LineItem {
  id: string;
  description: string;
  budget_type: BudgetType;
  amount: number;
  isNew?: boolean;
}

interface FormData {
  scheme_id: string;
  financial_year: string;
  proposal_type: ProposalType;
  justification: string;
  objectives: string;
  expected_outcomes: string;
}

export default function EditBudgetProposalPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const proposalId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    scheme_id: "",
    financial_year: "",
    proposal_type: "New",
    justification: "",
    objectives: "",
    expected_outcomes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    if (profile && !canCreateBudgetProposal(profile)) {
      toast.error("You don't have permission to edit budget proposals");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  useEffect(() => {
    fetchSchemes();
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId]);

  useEffect(() => {
    if (formData.scheme_id) {
      const scheme = schemes.find((s) => s.id === formData.scheme_id);
      setSelectedScheme(scheme || null);
    }
  }, [formData.scheme_id, schemes]);

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from("schemes")
        .select("*, ministry:ministries(id, name), department:departments(id, name)")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSchemes(data || []);
    } catch (error: any) {
      console.error("Error fetching schemes:", error);
    }
  };

  const fetchProposal = async () => {
    try {
      setLoadingData(true);

      const { data: proposal, error: proposalError } = await supabase
        .from("budget_proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (proposalError) throw proposalError;

      if (!proposal) {
        toast.error("Budget proposal not found");
        router.push("/dashboard/budgets");
        return;
      }

      if (proposal.status !== "Draft") {
        toast.error("Only draft proposals can be edited");
        router.push(`/dashboard/budgets/${proposalId}`);
        return;
      }

      setFormData({
        scheme_id: proposal.scheme_id,
        financial_year: proposal.financial_year,
        proposal_type: proposal.proposal_type,
        justification: proposal.justification || "",
        objectives: proposal.objectives || "",
        expected_outcomes: proposal.expected_outcomes || "",
      });

      const { data: items, error: itemsError } = await supabase
        .from("budget_line_items")
        .select("*")
        .eq("budget_proposal_id", proposalId)
        .order("created_at");

      if (itemsError) throw itemsError;

      setLineItems(
        (items || []).map((item) => ({
          id: item.id,
          description: item.description,
          budget_type: item.budget_type,
          amount: item.amount,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      toast.error(error.message || "Failed to fetch proposal");
      router.push("/dashboard/budgets");
    } finally {
      setLoadingData(false);
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

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: "",
        budget_type: "Capital",
        amount: 0,
        isNew: true,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.warning("At least one line item is required");
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.scheme_id) {
      newErrors.scheme_id = "Scheme is required";
    }
    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    } else if (formData.justification.length < 50) {
      newErrors.justification = "Justification must be at least 50 characters";
    }

    const hasEmptyDescriptions = lineItems.some((item) => !item.description.trim());
    if (hasEmptyDescriptions) {
      newErrors.lineItems = "All line items must have a description";
    }

    const hasInvalidAmounts = lineItems.some((item) => !item.amount || item.amount <= 0);
    if (hasInvalidAmounts) {
      newErrors.lineItems = "All line items must have a valid amount greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "Draft" | "Submitted" = "Draft") => {
    if (!validate()) {
      toast.error("Please fix all errors before saving");
      return;
    }

    try {
      setLoading(true);

      // Update budget proposal
      const { error: proposalError } = await supabase
        .from("budget_proposals")
        .update({
          scheme_id: formData.scheme_id,
          ministry_id: selectedScheme?.ministry_id,
          department_id: selectedScheme?.department_id,
          financial_year: formData.financial_year,
          proposal_type: formData.proposal_type,
          status: status,
          justification: formData.justification,
          objectives: formData.objectives || null,
          expected_outcomes: formData.expected_outcomes || null,
          total_amount: calculateTotal(),
        })
        .eq("id", proposalId);

      if (proposalError) throw proposalError;

      // Delete all existing line items
      const { error: deleteError } = await supabase
        .from("budget_line_items")
        .delete()
        .eq("budget_proposal_id", proposalId);

      if (deleteError) throw deleteError;

      // Insert all line items (new approach - simpler)
      const lineItemsData = lineItems.map((item) => ({
        budget_proposal_id: proposalId,
        description: item.description,
        budget_type: item.budget_type,
        amount: item.amount,
      }));

      const { error: lineItemsError } = await supabase
        .from("budget_line_items")
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast.success(`Budget proposal ${status === "Draft" ? "updated" : "submitted"} successfully`);
      router.push(`/dashboard/budgets/${proposalId}`);
    } catch (error: any) {
      console.error("Error updating budget proposal:", error);
      toast.error(error.message || "Failed to update budget proposal");
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
          Back to Proposal
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Budget Proposal</h1>
        <p className="text-gray-600 mt-1">Update proposal details and line items</p>
      </div>

      <Card className="max-w-5xl">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Scheme" htmlFor="scheme_id" required error={errors.scheme_id}>
                <Select
                  id="scheme_id"
                  value={formData.scheme_id}
                  onChange={(e) => handleChange("scheme_id", e.target.value)}
                  options={[
                    { value: "", label: "Select Scheme" },
                    ...schemes.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
                  ]}
                  error={errors.scheme_id}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Financial Year" required>
                <Select
                  value={formData.financial_year}
                  onChange={(e) => handleChange("financial_year", e.target.value)}
                  options={[
                    { value: "2025-26", label: "FY 2025-26" },
                    { value: "2026-27", label: "FY 2026-27" },
                  ]}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Proposal Type" required>
                <Select
                  value={formData.proposal_type}
                  onChange={(e) => handleChange("proposal_type", e.target.value as ProposalType)}
                  options={[
                    { value: "New", label: "New" },
                    { value: "Revised", label: "Revised" },
                    { value: "Supplementary", label: "Supplementary" },
                  ]}
                  disabled={loading}
                />
              </FormField>
            </div>

            <FormField
              label="Justification"
              required
              error={errors.justification}
              hint="Minimum 50 characters"
            >
              <Textarea
                value={formData.justification}
                onChange={(e) => handleChange("justification", e.target.value)}
                rows={6}
                error={errors.justification}
                disabled={loading}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Objectives">
                <Textarea
                  value={formData.objectives}
                  onChange={(e) => handleChange("objectives", e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Expected Outcomes">
                <Textarea
                  value={formData.expected_outcomes}
                  onChange={(e) => handleChange("expected_outcomes", e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Budget Line Items</h2>
              <Button onClick={addLineItem} variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            {errors.lineItems && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-700">{errors.lineItems}</p>
              </div>
            )}

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium">Line Item {index + 1}</h3>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(item.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField label="Description" required>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          disabled={loading}
                        />
                      </FormField>
                    </div>

                    <FormField label="Budget Type" required>
                      <Select
                        value={item.budget_type}
                        onChange={(e) => updateLineItem(item.id, "budget_type", e.target.value as BudgetType)}
                        options={[
                          { value: "Capital", label: "Capital" },
                          { value: "Revenue", label: "Revenue" },
                          { value: "Administrative", label: "Administrative" },
                          { value: "Other", label: "Other" },
                        ]}
                        disabled={loading}
                      />
                    </FormField>

                    <FormField label="Amount (₹)" required>
                      <Input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) => updateLineItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">{formatINR(calculateTotal())}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button onClick={() => router.back()} variant="ghost" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit("Draft")} variant="secondary" disabled={loading} isLoading={loading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("Submitted")} disabled={loading} isLoading={loading}>
              Update & Submit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
