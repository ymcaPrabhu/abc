"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BudgetProposal, Scheme, Ministry } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, formatDate } from "@/lib/utils/formatters";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  Card,
} from "@/components/ui";

interface ProposalWithRelations extends BudgetProposal {
  scheme?: Scheme;
  ministry?: Ministry;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [proposals, setProposals] = useState<ProposalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchPendingApprovals();
    }
  }, [profile]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      // Fetch proposals that need approval based on user role
      let query = supabase
        .from("budget_proposals")
        .select(`
          *,
          scheme:schemes(id, name, code),
          ministry:ministries(id, name, code)
        `)
        .in("status", ["Submitted", "Under Review"]);

      // Filter based on user role
      if (profile?.role === "Department Head") {
        // Department heads see proposals from their department
        query = query.eq("department_id", profile.department_id);
      } else if (profile?.role === "Ministry Secretary") {
        // Ministry secretaries see proposals from their ministry
        query = query.eq("ministry_id", profile.ministry_id);
      } else if (profile?.role === "Finance Ministry Admin" || profile?.role === "Budget Division Officer") {
        // Finance ministry sees all proposals
        // No additional filter needed
      } else {
        // Other roles don't have approval permissions
        setProposals([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error: any) {
      console.error("Error fetching approvals:", error);
      toast.error(error.message || "Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (proposalId: string) => {
    if (!confirm("Are you sure you want to approve this proposal?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("budget_proposals")
        .update({ status: "Approved" })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Proposal approved successfully");
      fetchPendingApprovals();
    } catch (error: any) {
      console.error("Error approving proposal:", error);
      toast.error(error.message || "Failed to approve proposal");
    }
  };

  const handleQuickReject = async (proposalId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from("budget_proposals")
        .update({ status: "Rejected" })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success("Proposal rejected");
      fetchPendingApprovals();
    } catch (error: any) {
      console.error("Error rejecting proposal:", error);
      toast.error(error.message || "Failed to reject proposal");
    }
  };

  const columns: Column<ProposalWithRelations>[] = [
    {
      key: "proposal_number",
      header: "Proposal Number",
      sortable: true,
      render: (value) => <span className="font-medium text-blue-600">{value}</span>,
    },
    {
      key: "scheme",
      header: "Scheme",
      sortable: true,
      render: (value: Scheme | undefined) => (
        <span className="text-sm text-gray-900">{value?.name || "N/A"}</span>
      ),
    },
    {
      key: "ministry",
      header: "Ministry",
      render: (value: Ministry | undefined) => (
        <span className="text-sm text-gray-700">{value?.name || "N/A"}</span>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      sortable: true,
      render: (value) => <span className="font-medium">{formatINR(value)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <Badge variant={value === "Submitted" ? "info" : "warning"}>{value}</Badge>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{formatDate(value)}</span>,
    },
    {
      key: "id",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/budgets/${row.id}`)}
            className="text-gray-600 hover:text-gray-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleQuickApprove(row.id)}
            className="text-green-600 hover:text-green-800"
            title="Approve"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleQuickReject(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Reject"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    pending: proposals.filter(p => p.status === "Submitted").length,
    underReview: proposals.filter(p => p.status === "Under Review").length,
    total: proposals.length,
    totalAmount: proposals.reduce((sum, p) => sum + p.total_amount, 0),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve budget proposals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">New Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.underReview}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatINR(stats.totalAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card>
        <DataTable
          data={proposals}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No pending approvals at this time"
          onRowClick={(row) => router.push(`/dashboard/budgets/${row.id}`)}
        />
      </Card>
    </div>
  );
}
