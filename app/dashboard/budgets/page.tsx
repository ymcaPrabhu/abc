"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BudgetProposal, Ministry, Scheme, Department, ProposalStatus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import { formatINR, formatDate, getCurrentFinancialYear } from "@/lib/utils/formatters";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  SearchFilter,
  FilterConfig,
  Select,
} from "@/components/ui";

interface ProposalWithRelations extends BudgetProposal {
  scheme?: Scheme;
  ministry?: Ministry;
  department?: Department;
}

export default function BudgetProposalsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [proposals, setProposals] = useState<ProposalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());

  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  useEffect(() => {
    fetchMinistries();
    fetchSchemes();
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [selectedFY]);

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

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from("schemes")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSchemes(data || []);
    } catch (error: any) {
      console.error("Error fetching schemes:", error);
    }
  };

  const fetchProposals = async () => {
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
        .eq("financial_year", selectedFY)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error: any) {
      console.error("Error fetching budget proposals:", error);
      toast.error(error.message || "Failed to fetch budget proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget proposal?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("budget_proposals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Budget proposal deleted successfully");
      fetchProposals();
    } catch (error: any) {
      console.error("Error deleting proposal:", error);
      toast.error(error.message || "Failed to delete proposal");
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

  // Filter configuration
  const filters: FilterConfig[] = [
    {
      key: "ministry_id",
      label: "Ministry",
      type: "select",
      options: ministries.map((m) => ({ value: m.id, label: m.name })),
    },
    {
      key: "scheme_id",
      label: "Scheme",
      type: "select",
      options: schemes.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Draft", label: "Draft" },
        { value: "Submitted", label: "Submitted" },
        { value: "Under Review", label: "Under Review" },
        { value: "Approved", label: "Approved" },
        { value: "Rejected", label: "Rejected" },
        { value: "Revision Requested", label: "Revision Requested" },
      ],
    },
    {
      key: "proposal_type",
      label: "Type",
      type: "select",
      options: [
        { value: "New", label: "New" },
        { value: "Revised", label: "Revised" },
        { value: "Supplementary", label: "Supplementary" },
      ],
    },
  ];

  // Filter and search logic
  const filteredProposals = proposals.filter((proposal) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        proposal.proposal_number.toLowerCase().includes(query) ||
        proposal.scheme?.name.toLowerCase().includes(query) ||
        proposal.ministry?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Apply filters
    if (filterValues.ministry_id && proposal.ministry_id !== filterValues.ministry_id) {
      return false;
    }
    if (filterValues.scheme_id && proposal.scheme_id !== filterValues.scheme_id) {
      return false;
    }
    if (filterValues.status && proposal.status !== filterValues.status) {
      return false;
    }
    if (filterValues.proposal_type && proposal.proposal_type !== filterValues.proposal_type) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === "Draft").length,
    submitted: proposals.filter((p) => p.status === "Submitted").length,
    approved: proposals.filter((p) => p.status === "Approved").length,
    totalAmount: proposals.reduce((sum, p) => sum + p.total_amount, 0),
  };

  // Table columns
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
      key: "proposal_type",
      header: "Type",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "total_amount",
      header: "Amount",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{formatINR(value)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: ProposalStatus) => (
        <Badge variant={getStatusBadgeVariant(value)}>{value}</Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/budgets/${row.id}`)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === "Draft" && (
            <button
              onClick={() => router.push(`/dashboard/budgets/${row.id}/edit`)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {row.status === "Draft" && (
            <button
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const canCreate = profile && canCreateBudgetProposal(profile);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Proposals</h1>
          <p className="text-gray-600 mt-1">
            Manage budget proposals for FY {selectedFY}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            options={[
              { value: "2025-26", label: "FY 2025-26" },
              { value: "2024-25", label: "FY 2024-25" },
              { value: "2023-24", label: "FY 2023-24" },
            ]}
          />
          {canCreate && (
            <Link href="/dashboard/budgets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilter
          onSearch={setSearchQuery}
          filters={filters}
          onFilterChange={setFilterValues}
          placeholder="Search proposals by number, scheme, or ministry..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatINR(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredProposals}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage={`No budget proposals found for FY ${selectedFY}. Create your first proposal to get started.`}
          onRowClick={(row) => router.push(`/dashboard/budgets/${row.id}`)}
        />
      </div>
    </div>
  );
}
