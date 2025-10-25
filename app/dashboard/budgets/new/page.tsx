"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, Ministry, Department, ProposalType, BudgetType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import { getCurrentFinancialYear, formatINR } from "@/lib/utils/formatters";
import {
  Button,
  Input,
  Select,
  Textarea,
  FormField,
  Card,
  Tabs,
  useToast,
} from "@/components/ui";

interface LineItem {
  id: string;
  description: string;
  budget_type: BudgetType;
  amount: number;
}

interface FormData {
  scheme_id: string;
  financial_year: string;
  proposal_type: ProposalType;
  justification: string;
  objectives: string;
  expected_outcomes: string;
}

export default function NewBudgetProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    scheme_id: searchParams.get("scheme_id") || "",
    financial_year: getCurrentFinancialYear(),
    proposal_type: "New",
    justification: "",
    objectives: "",
    expected_outcomes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", budget_type: "Capital", amount: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  // Check authorization
  useEffect(() => {
    if (profile && !canCreateBudgetProposal(profile)) {
      toast.error("You don't have permission to create budget proposals");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  // Fetch schemes
  useEffect(() => {
    fetchSchemes();
  }, []);

  // Load selected scheme details
  useEffect(() => {
    if (formData.scheme_id) {
      loadSchemeDetails(formData.scheme_id);
    }
  }, [formData.scheme_id]);

  const fetchSchemes = async () => {
    try {
      setLoadingSchemes(true);
      let query = supabase
        .from("schemes")
        .select("*, ministry:ministries(id, name), department:departments(id, name)")
        .eq("is_active", true)
        .order("name");

      // Filter by user's ministry/department if not admin
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

  const loadSchemeDetails = async (schemeId: string) => {
    try {
      const scheme = schemes.find((s) => s.id === schemeId);
      if (scheme) {
        setSelectedScheme(scheme);
      }
    } catch (error: any) {
      console.error("Error loading scheme:", error);
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
      { id: crypto.randomUUID(), description: "", budget_type: "Capital", amount: 0 },
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.scheme_id) {
        newErrors.scheme_id = "Scheme is required";
      }
      if (!formData.financial_year) {
        newErrors.financial_year = "Financial year is required";
      }
      if (!formData.justification.trim()) {
        newErrors.justification = "Justification is required";
      } else if (formData.justification.length < 50) {
        newErrors.justification = "Justification must be at least 50 characters";
      }
    }

    if (step === 1) {
      const hasEmptyDescriptions = lineItems.some((item) => !item.description.trim());
      if (hasEmptyDescriptions) {
        newErrors.lineItems = "All line items must have a description";
      }

      const hasInvalidAmounts = lineItems.some((item) => !item.amount || item.amount <= 0);
      if (hasInvalidAmounts) {
        newErrors.lineItems = "All line items must have a valid amount greater than 0";
      }

      const total = calculateTotal();
      if (total === 0) {
        newErrors.lineItems = "Total amount must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error("Please fix the errors before proceeding");
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (status: "Draft" | "Submitted" = "Draft") => {
    if (!validateStep(0) || !validateStep(1)) {
      toast.error("Please fix all errors before submitting");
      setCurrentStep(0);
      return;
    }

    try {
      setLoading(true);

      // Generate proposal number
      const ministryCode = selectedScheme?.ministry?.code || "XXX";
      const year = formData.financial_year.split("-")[0];

      // Get sequence number
      const { count } = await supabase
        .from("budget_proposals")
        .select("*", { count: "exact", head: true })
        .eq("financial_year", formData.financial_year)
        .eq("ministry_id", selectedScheme?.ministry_id);

      const sequence = String((count || 0) + 1).padStart(4, "0");
      const proposalNumber = `BP-${ministryCode}-${year}-${sequence}`;

      // Create budget proposal
      const { data: proposal, error: proposalError } = await supabase
        .from("budget_proposals")
        .insert([
          {
            proposal_number: proposalNumber,
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
            created_by: profile?.id,
          },
        ])
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Create line items
      const lineItemsData = lineItems.map((item) => ({
        budget_proposal_id: proposal.id,
        description: item.description,
        budget_type: item.budget_type,
        amount: item.amount,
      }));

      const { error: lineItemsError } = await supabase
        .from("budget_line_items")
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast.success(`Budget proposal ${status === "Draft" ? "saved as draft" : "submitted"} successfully`);
      router.push(`/dashboard/budgets/${proposal.id}`);
    } catch (error: any) {
      console.error("Error creating budget proposal:", error);
      toast.error(error.message || "Failed to create budget proposal");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Basic Information", description: "Proposal details" },
    { title: "Line Items", description: "Budget breakdown" },
    { title: "Review & Submit", description: "Final review" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Budget Proposals
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Budget Proposal</h1>
        <p className="text-gray-600 mt-1">Submit a new budget proposal for approval</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-4 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      index <= currentStep ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="max-w-5xl">
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Scheme"
                htmlFor="scheme_id"
                required
                error={errors.scheme_id}
              >
                <Select
                  id="scheme_id"
                  value={formData.scheme_id}
                  onChange={(e) => handleChange("scheme_id", e.target.value)}
                  options={[
                    { value: "", label: "Select Scheme" },
                    ...schemes.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.code})`,
                    })),
                  ]}
                  error={errors.scheme_id}
                  disabled={loading || loadingSchemes}
                />
              </FormField>

              <FormField
                label="Financial Year"
                htmlFor="financial_year"
                required
                error={errors.financial_year}
              >
                <Select
                  id="financial_year"
                  value={formData.financial_year}
                  onChange={(e) => handleChange("financial_year", e.target.value)}
                  options={[
                    { value: "2025-26", label: "FY 2025-26" },
                    { value: "2026-27", label: "FY 2026-27" },
                    { value: "2027-28", label: "FY 2027-28" },
                  ]}
                  error={errors.financial_year}
                  disabled={loading}
                />
              </FormField>

              <FormField
                label="Proposal Type"
                htmlFor="proposal_type"
                required
              >
                <Select
                  id="proposal_type"
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

              {selectedScheme && (
                <div className="md:col-span-2">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Scheme</h3>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Ministry:</span>{" "}
                      {selectedScheme.ministry?.name || "N/A"}
                    </p>
                    {selectedScheme.department && (
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Department:</span>{" "}
                        {selectedScheme.department.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <FormField
              label="Justification"
              htmlFor="justification"
              required
              error={errors.justification}
              hint="Explain why this budget is needed (minimum 50 characters)"
            >
              <Textarea
                id="justification"
                value={formData.justification}
                onChange={(e) => handleChange("justification", e.target.value)}
                placeholder="Provide detailed justification for this budget request..."
                rows={6}
                error={errors.justification}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.justification.length} / 50 characters
              </p>
            </FormField>

            <FormField
              label="Objectives"
              htmlFor="objectives"
              hint="Key objectives to be achieved (optional)"
            >
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => handleChange("objectives", e.target.value)}
                placeholder="List the main objectives..."
                rows={4}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Expected Outcomes"
              htmlFor="expected_outcomes"
              hint="Expected outcomes and deliverables (optional)"
            >
              <Textarea
                id="expected_outcomes"
                value={formData.expected_outcomes}
                onChange={(e) => handleChange("expected_outcomes", e.target.value)}
                placeholder="Describe expected outcomes..."
                rows={4}
                disabled={loading}
              />
            </FormField>
          </div>
        )}

        {/* Step 2: Line Items */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Budget Line Items</h2>
              <Button onClick={addLineItem} variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            {errors.lineItems && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.lineItems}</p>
              </div>
            )}

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Line Item {index + 1}
                    </h3>
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField label="Description" required>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, "description", e.target.value)
                          }
                          placeholder="e.g., Staff salaries, Equipment purchase..."
                          disabled={loading}
                        />
                      </FormField>
                    </div>

                    <FormField label="Budget Type" required>
                      <Select
                        value={item.budget_type}
                        onChange={(e) =>
                          updateLineItem(item.id, "budget_type", e.target.value as BudgetType)
                        }
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
                        onChange={(e) =>
                          updateLineItem(item.id, "amount", parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={loading}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatINR(calculateTotal())}
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Proposal Details</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Scheme</dt>
                    <dd className="text-gray-900 font-medium">{selectedScheme?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Financial Year</dt>
                    <dd className="text-gray-900 font-medium">FY {formData.financial_year}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Proposal Type</dt>
                    <dd className="text-gray-900 font-medium">{formData.proposal_type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Total Amount</dt>
                    <dd className="text-gray-900 font-medium">{formatINR(calculateTotal())}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Line Items ({lineItems.length})</h3>
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {index + 1}. {item.description}
                      </span>
                      <span className="text-gray-900 font-medium">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  You can save this proposal as a <strong>Draft</strong> to continue editing later, or{" "}
                  <strong>Submit</strong> it for approval workflow.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button onClick={handleBack} variant="ghost" disabled={loading}>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 2 && (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            )}
            {currentStep === 2 && (
              <>
                <Button
                  onClick={() => handleSubmit("Draft")}
                  variant="secondary"
                  disabled={loading}
                  isLoading={loading}
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit("Submitted")}
                  disabled={loading}
                  isLoading={loading}
                >
                  Submit for Approval
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
