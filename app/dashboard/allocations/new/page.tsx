"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BudgetProposal, Scheme } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, getCurrentFinancialYear } from "@/lib/utils/formatters";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  Card,
  Input,
  Select,
  useToast,
  FormField,
} from "@/components/ui";

export default function NewAllocationPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [approvedProposals, setApprovedProposals] = useState<BudgetProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    proposal_id: "",
    financial_year: getCurrentFinancialYear(),
    sanctioned_amount: "",
    q1_allocation: "",
    q2_allocation: "",
    q3_allocation: "",
    q4_allocation: "",
  });

  useEffect(() => {
    if (profile) {
      if (!isAdmin(profile) && profile.role !== "Budget Division Officer") {
        toast.error("You don't have permission to create budget allocations");
        router.push("/dashboard/allocations");
        return;
      }
      fetchApprovedProposals();
    }
  }, [profile]);

  const fetchApprovedProposals = async () => {
    try {
      // Fetch approved proposals that don't have allocations yet
      const { data: proposals, error } = await supabase
        .from("budget_proposals")
        .select(`
          *,
          scheme:schemes(id, name, code),
          ministry:ministries(name)
        `)
        .eq("status", "Approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out proposals that already have allocations
      const { data: existingAllocations } = await supabase
        .from("budget_allocations")
        .select("proposal_id");

      const allocatedProposalIds = new Set(
        existingAllocations?.map((a) => a.proposal_id) || []
      );

      const availableProposals = proposals?.filter(
        (p) => !allocatedProposalIds.has(p.id)
      ) || [];

      setApprovedProposals(availableProposals);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      toast.error(error.message || "Failed to fetch approved proposals");
    }
  };

  const selectedProposal = approvedProposals.find(
    (p) => p.id === formData.proposal_id
  );

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateQuarterlyTotal = () => {
    const q1 = parseFloat(formData.q1_allocation) || 0;
    const q2 = parseFloat(formData.q2_allocation) || 0;
    const q3 = parseFloat(formData.q3_allocation) || 0;
    const q4 = parseFloat(formData.q4_allocation) || 0;
    const quarterlyTotal = q1 + q2 + q3 + q4;
    const sanctioned = parseFloat(formData.sanctioned_amount) || 0;

    if (quarterlyTotal > 0 && Math.abs(quarterlyTotal - sanctioned) > 0.01) {
      return `Quarterly allocations (${formatINR(quarterlyTotal)}) must equal sanctioned amount (${formatINR(sanctioned)})`;
    }

    return null;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.proposal_id) {
      newErrors.proposal_id = "Please select an approved proposal";
    }

    if (!formData.sanctioned_amount || parseFloat(formData.sanctioned_amount) <= 0) {
      newErrors.sanctioned_amount = "Sanctioned amount must be greater than zero";
    }

    // Check if quarterly allocations add up
    const quarterlyError = validateQuarterlyTotal();
    if (quarterlyError) {
      newErrors.quarterly = quarterlyError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const allocationData = {
        proposal_id: formData.proposal_id,
        scheme_id: selectedProposal?.scheme_id,
        financial_year: formData.financial_year,
        sanctioned_amount: parseFloat(formData.sanctioned_amount),
        q1_allocation: formData.q1_allocation ? parseFloat(formData.q1_allocation) : null,
        q2_allocation: formData.q2_allocation ? parseFloat(formData.q2_allocation) : null,
        q3_allocation: formData.q3_allocation ? parseFloat(formData.q3_allocation) : null,
        q4_allocation: formData.q4_allocation ? parseFloat(formData.q4_allocation) : null,
        status: "Active",
        sanctioned_by: profile?.id,
      };

      const { data, error } = await supabase
        .from("budget_allocations")
        .insert([allocationData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Budget allocation created successfully");
      router.push(`/dashboard/allocations/${data.id}`);
    } catch (error: any) {
      console.error("Error creating allocation:", error);
      toast.error(error.message || "Failed to create budget allocation");
    } finally {
      setLoading(false);
    }
  };

  const quarterlyTotal =
    (parseFloat(formData.q1_allocation) || 0) +
    (parseFloat(formData.q2_allocation) || 0) +
    (parseFloat(formData.q3_allocation) || 0) +
    (parseFloat(formData.q4_allocation) || 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Budget Allocation</h1>
        <p className="text-gray-600 mt-1">
          Sanction approved budget proposals and allocate funds quarterly
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Proposal Selection */}
            <FormField label="Approved Proposal *" error={errors.proposal_id}>
              <Select
                value={formData.proposal_id}
                onChange={(e) => handleChange("proposal_id", e.target.value)}
                required
              >
                <option value="">Select an approved proposal</option>
                {approvedProposals.map((proposal) => (
                  <option key={proposal.id} value={proposal.id}>
                    {proposal.proposal_number} - {proposal.scheme?.name} ({formatINR(proposal.total_amount)})
                  </option>
                ))}
              </Select>
              {approvedProposals.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No approved proposals available for allocation
                </p>
              )}
            </FormField>

            {/* Selected Proposal Details */}
            {selectedProposal && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Proposal Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Scheme:</span>
                    <span className="ml-2 font-medium">{selectedProposal.scheme?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Proposal Number:</span>
                    <span className="ml-2 font-medium">{selectedProposal.proposal_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">{formatINR(selectedProposal.total_amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Financial Year:</span>
                    <span className="ml-2 font-medium">{selectedProposal.financial_year}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Year */}
            <FormField label="Financial Year *">
              <Select
                value={formData.financial_year}
                onChange={(e) => handleChange("financial_year", e.target.value)}
                required
              >
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </Select>
            </FormField>

            {/* Sanctioned Amount */}
            <FormField label="Sanctioned Amount (₹) *" error={errors.sanctioned_amount}>
              <Input
                type="number"
                value={formData.sanctioned_amount}
                onChange={(e) => handleChange("sanctioned_amount", e.target.value)}
                placeholder="Enter sanctioned amount"
                step="0.01"
                min="0"
                required
              />
              {selectedProposal && (
                <p className="text-sm text-gray-500 mt-1">
                  Proposed amount: {formatINR(selectedProposal.total_amount)}
                </p>
              )}
            </FormField>

            {/* Quarterly Breakdown */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quarterly Allocation Breakdown (Optional)
              </h3>
              {errors.quarterly && (
                <p className="text-sm text-red-600 mb-3">{errors.quarterly}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Q1 Allocation (Apr-Jun)">
                  <Input
                    type="number"
                    value={formData.q1_allocation}
                    onChange={(e) => handleChange("q1_allocation", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>

                <FormField label="Q2 Allocation (Jul-Sep)">
                  <Input
                    type="number"
                    value={formData.q2_allocation}
                    onChange={(e) => handleChange("q2_allocation", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>

                <FormField label="Q3 Allocation (Oct-Dec)">
                  <Input
                    type="number"
                    value={formData.q3_allocation}
                    onChange={(e) => handleChange("q3_allocation", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>

                <FormField label="Q4 Allocation (Jan-Mar)">
                  <Input
                    type="number"
                    value={formData.q4_allocation}
                    onChange={(e) => handleChange("q4_allocation", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>
              </div>

              {/* Quarterly Total */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Quarterly Total:</span>
                  <span className={`font-bold ${
                    quarterlyTotal > 0 && formData.sanctioned_amount &&
                    Math.abs(quarterlyTotal - parseFloat(formData.sanctioned_amount)) < 0.01
                      ? "text-green-600"
                      : quarterlyTotal > 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}>
                    {formatINR(quarterlyTotal)}
                  </span>
                </div>
                {formData.sanctioned_amount && quarterlyTotal > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-gray-900">
                      {formatINR(parseFloat(formData.sanctioned_amount) - quarterlyTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || approvedProposals.length === 0}
                isLoading={loading}
              >
                Create Allocation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/allocations")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
