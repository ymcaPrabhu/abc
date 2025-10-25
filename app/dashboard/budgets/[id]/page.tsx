"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Send, Calendar, FileText, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BudgetProposal, BudgetLineItem, Scheme, Ministry, Department, ProposalStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import { formatINR, formatDate } from "@/lib/utils/formatters";
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  useToast,
  DataTable,
  Column,
} from "@/components/ui";

interface ProposalWithRelations extends BudgetProposal {
  scheme?: Scheme;
  ministry?: Ministry;
  department?: Department;
}

export default function BudgetProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalWithRelations | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
      fetchLineItems();
    }
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("budget_proposals")
        .select(`
          *,
          scheme:schemes(id, name, code),
          ministry:ministries(id, name, code),
          department:departments(id, name, code)
        `)
        .eq("id", proposalId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Budget proposal not found");
        router.push("/dashboard/budgets");
        return;
      }

      setProposal(data);
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      toast.error(error.message || "Failed to fetch proposal");
      router.push("/dashboard/budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_line_items")
        .select("*")
        .eq("budget_proposal_id", proposalId)
        .order("created_at");

      if (error) throw error;
      setLineItems(data || []);
    } catch (error: any) {
      console.error("Error fetching line items:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this budget proposal? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("budget_proposals")
        .delete()
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Budget proposal deleted successfully");
      router.push("/dashboard/budgets");
    } catch (error: any) {
      console.error("Error deleting proposal:", error);
      toast.error(error.message || "Failed to delete proposal");
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit this proposal for approval?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("budget_proposals")
        .update({ status: "Submitted" })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Budget proposal submitted for approval");
      fetchProposal();
    } catch (error: any) {
      console.error("Error submitting proposal:", error);
      toast.error(error.message || "Failed to submit proposal");
    }
  };

  const getStatusBadgeVariant = (status: ProposalStatus) => {
    const variants: Record<ProposalStatus, "success" | "danger" | "warning" | "info" | "outline"> = {
      Draft: "outline",
      Submitted: "info",
      "Under Review": "warning",
      Approved: "success",
      Rejected: "danger",
      "Revision Requested": "warning",
    };
    return variants[status] || "outline";
  };

  // Line items table columns
  const columns: Column<BudgetLineItem>[] = [
    {
      key: "description",
      header: "Description",
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: "budget_type",
      header: "Type",
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (value) => <span className="font-medium text-gray-900">{formatINR(value)}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const canEdit = proposal.status === "Draft" && profile && canCreateBudgetProposal(profile);
  const canDelete = proposal.status === "Draft" && profile && canCreateBudgetProposal(profile);
  const canSubmitForApproval = proposal.status === "Draft" && profile && canCreateBudgetProposal(profile);

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

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{proposal.proposal_number}</h1>
              <Badge variant={getStatusBadgeVariant(proposal.status)}>
                {proposal.status}
              </Badge>
            </div>
            <p className="text-gray-600">{proposal.scheme?.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {canSubmitForApproval && (
              <Button onClick={handleSubmit} variant="secondary">
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            {canEdit && (
              <Link href={`/dashboard/budgets/${proposal.id}/edit`}>
                <Button variant="secondary">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Details */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Financial Year</label>
                  <p className="text-gray-900">FY {proposal.financial_year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Proposal Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">{proposal.proposal_type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-2xl font-bold text-blue-600">{formatINR(proposal.total_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {proposal.justification && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Justification</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{proposal.justification}</p>
                </div>
              )}

              {proposal.objectives && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Objectives</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{proposal.objectives}</p>
                </div>
              )}

              {proposal.expected_outcomes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Outcomes</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{proposal.expected_outcomes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Budget Line Items ({lineItems.length})
            </h2>
            <DataTable
              data={lineItems}
              columns={columns}
              keyField="id"
              emptyMessage="No line items found"
            />

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatINR(proposal.total_amount)}
              </span>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Scheme
                </label>
                <p className="mt-1 text-gray-900">{proposal.scheme?.name}</p>
                <p className="text-sm text-gray-500 font-mono">{proposal.scheme?.code}</p>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Ministry
                </label>
                <p className="mt-1 text-gray-900">{proposal.ministry?.name}</p>
                <p className="text-sm text-gray-500 font-mono">{proposal.ministry?.code}</p>
              </div>

              {proposal.department && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </label>
                  <p className="mt-1 text-gray-900">{proposal.department.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{proposal.department.code}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </label>
                <p className="text-gray-900">{formatDate(proposal.created_at)}</p>
              </div>
              <div>
                <label className="text-gray-500">Last Updated</label>
                <p className="text-gray-900">{formatDate(proposal.updated_at)}</p>
              </div>
              <div>
                <label className="text-gray-500">Proposal ID</label>
                <p className="text-gray-900 font-mono text-xs break-all">{proposal.id}</p>
              </div>
            </div>
          </Card>

          {/* Status Information */}
          {proposal.status !== "Draft" && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700">
                    {proposal.status === "Submitted" && "Proposal submitted and awaiting review"}
                    {proposal.status === "Under Review" && "Proposal is being reviewed by approvers"}
                    {proposal.status === "Approved" && "Proposal has been approved"}
                    {proposal.status === "Rejected" && "Proposal has been rejected"}
                    {proposal.status === "Revision Requested" && "Revisions requested by approver"}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
