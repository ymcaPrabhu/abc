"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Edit, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BudgetAllocation, Scheme, BudgetProposal } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, formatDate, getCurrentFinancialYear } from "@/lib/utils/formatters";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  Card,
  Select,
} from "@/components/ui";

interface AllocationWithRelations extends BudgetAllocation {
  scheme?: Scheme;
  proposal?: BudgetProposal;
}

export default function AllocationsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [allocations, setAllocations] = useState<AllocationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (profile) {
      fetchAllocations();
    }
  }, [profile, financialYear, statusFilter]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("budget_allocations")
        .select(`
          *,
          scheme:schemes(id, name, code, ministry_id),
          proposal:budget_proposals(id, proposal_number, total_amount)
        `)
        .eq("financial_year", financialYear);

      // Filter by status
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply role-based filtering
      if (profile && !isAdmin(profile) && profile.role !== "Budget Division Officer") {
        if (profile.ministry_id) {
          query = query.eq("scheme.ministry_id", profile.ministry_id);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (error: any) {
      console.error("Error fetching allocations:", error);
      toast.error(error.message || "Failed to fetch budget allocations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (allocationId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Frozen" : "Active";

    if (!confirm(`Are you sure you want to ${newStatus === "Frozen" ? "freeze" : "unfreeze"} this allocation?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("budget_allocations")
        .update({ status: newStatus })
        .eq("id", allocationId);

      if (error) throw error;

      toast.success(`Allocation ${newStatus === "Frozen" ? "frozen" : "unfrozen"} successfully`);
      fetchAllocations();
    } catch (error: any) {
      console.error("Error updating allocation status:", error);
      toast.error(error.message || "Failed to update allocation status");
    }
  };

  const columns: Column<AllocationWithRelations>[] = [
    {
      key: "scheme",
      header: "Scheme",
      sortable: true,
      render: (value: Scheme | undefined) => (
        <span className="font-medium text-gray-900">{value?.name || "N/A"}</span>
      ),
    },
    {
      key: "proposal",
      header: "Proposal",
      render: (value: BudgetProposal | undefined) => (
        <span className="text-sm text-blue-600">{value?.proposal_number || "N/A"}</span>
      ),
    },
    {
      key: "sanctioned_amount",
      header: "Sanctioned Amount",
      sortable: true,
      render: (value) => <span className="font-medium">{formatINR(value)}</span>,
    },
    {
      key: "q1_allocation",
      header: "Q1",
      render: (value) => <span className="text-sm">{value ? formatINR(value) : "-"}</span>,
    },
    {
      key: "q2_allocation",
      header: "Q2",
      render: (value) => <span className="text-sm">{value ? formatINR(value) : "-"}</span>,
    },
    {
      key: "q3_allocation",
      header: "Q3",
      render: (value) => <span className="text-sm">{value ? formatINR(value) : "-"}</span>,
    },
    {
      key: "q4_allocation",
      header: "Q4",
      render: (value) => <span className="text-sm">{value ? formatINR(value) : "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (value) => {
        const variant = value === "Active" ? "success" : value === "Frozen" ? "warning" : "outline";
        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      key: "sanctioned_at",
      header: "Sanctioned",
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{formatDate(value)}</span>,
    },
    {
      key: "id",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/allocations/${row.id}`)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(isAdmin(profile) || profile?.role === "Budget Division Officer") && (
            <>
              <button
                onClick={() => router.push(`/dashboard/allocations/${row.id}?edit=true`)}
                className="text-gray-600 hover:text-gray-800"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleToggleStatus(row.id, row.status)}
                className={row.status === "Active" ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                title={row.status === "Active" ? "Freeze" : "Unfreeze"}
              >
                {row.status === "Active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    total: allocations.length,
    totalAmount: allocations.reduce((sum, a) => sum + a.sanctioned_amount, 0),
    active: allocations.filter(a => a.status === "Active").length,
    frozen: allocations.filter(a => a.status === "Frozen").length,
    q1Total: allocations.reduce((sum, a) => sum + (a.q1_allocation || 0), 0),
    q2Total: allocations.reduce((sum, a) => sum + (a.q2_allocation || 0), 0),
    q3Total: allocations.reduce((sum, a) => sum + (a.q3_allocation || 0), 0),
    q4Total: allocations.reduce((sum, a) => sum + (a.q4_allocation || 0), 0),
  };

  const canCreateAllocation = profile && (isAdmin(profile) || profile.role === "Budget Division Officer");

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Allocations</h1>
          <p className="text-gray-600 mt-1">
            Manage sanctioned budget allocations and quarterly breakdowns
          </p>
        </div>
        {canCreateAllocation && (
          <Link href="/dashboard/allocations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Allocation
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Financial Year
          </label>
          <Select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
          >
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </Select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Frozen">Frozen</option>
            <option value="Exhausted">Exhausted</option>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Allocations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Sanctioned</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(stats.totalAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Frozen</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.frozen}</p>
          </div>
        </Card>
      </div>

      {/* Quarterly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Q1 Allocation</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(stats.q1Total)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Q2 Allocation</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(stats.q2Total)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Q3 Allocation</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(stats.q3Total)}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Q4 Allocation</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(stats.q4Total)}</p>
          </div>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card>
        <DataTable
          data={allocations}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No budget allocations found"
          onRowClick={(row) => router.push(`/dashboard/allocations/${row.id}`)}
        />
      </Card>
    </div>
  );
}
