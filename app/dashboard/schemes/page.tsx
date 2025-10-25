"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, Ministry, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  SearchFilter,
  FilterConfig,
} from "@/components/ui";

interface SchemeWithRelations extends Scheme {
  ministry?: Ministry;
  department?: Department;
}

export default function SchemesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [schemes, setSchemes] = useState<SchemeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchMinistries();
    fetchDepartments();
    fetchSchemes();
  }, []);

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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("schemes")
        .select(`
          *,
          ministry:ministries(id, name, code),
          department:departments(id, name, code)
        `)
        .order("name");

      if (error) throw error;
      setSchemes(data || []);
    } catch (error: any) {
      console.error("Error fetching schemes:", error);
      toast.error(error.message || "Failed to fetch schemes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheme?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("schemes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Scheme deleted successfully");
      fetchSchemes();
    } catch (error: any) {
      console.error("Error deleting scheme:", error);
      toast.error(error.message || "Failed to delete scheme");
    }
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
      key: "department_id",
      label: "Department",
      type: "select",
      options: departments.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      key: "scheme_type",
      label: "Type",
      type: "select",
      options: [
        { value: "Central Sector", label: "Central Sector" },
        { value: "Centrally Sponsored", label: "Centrally Sponsored" },
        { value: "State Sector", label: "State Sector" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "is_active",
      label: "Status",
      type: "select",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
    },
  ];

  // Filter and search logic
  const filteredSchemes = schemes.filter((scheme) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        scheme.name.toLowerCase().includes(query) ||
        scheme.code.toLowerCase().includes(query) ||
        scheme.ministry?.name.toLowerCase().includes(query) ||
        scheme.department?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Apply filters
    if (filterValues.ministry_id && scheme.ministry_id !== filterValues.ministry_id) {
      return false;
    }
    if (filterValues.department_id && scheme.department_id !== filterValues.department_id) {
      return false;
    }
    if (filterValues.scheme_type && scheme.scheme_type !== filterValues.scheme_type) {
      return false;
    }
    if (filterValues.is_active && scheme.is_active.toString() !== filterValues.is_active) {
      return false;
    }

    return true;
  });

  // Table columns
  const columns: Column<SchemeWithRelations>[] = [
    {
      key: "name",
      header: "Scheme Name",
      sortable: true,
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (value) => (
        <span className="text-sm font-mono text-gray-600">{value}</span>
      ),
    },
    {
      key: "ministry",
      header: "Ministry",
      sortable: true,
      render: (value: Ministry | undefined) => (
        <span className="text-sm text-gray-700">{value?.name || "N/A"}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (value: Department | undefined) => (
        <span className="text-sm text-gray-700">{value?.name || "N/A"}</span>
      ),
    },
    {
      key: "scheme_type",
      header: "Type",
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (value) => (
        <Badge variant={value ? "success" : "danger"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/schemes/${row.id}`)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/dashboard/schemes/${row.id}/edit`)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schemes</h1>
          <p className="text-gray-600 mt-1">Government schemes and programs</p>
        </div>
        <Link href="/dashboard/schemes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Scheme
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilter
          onSearch={setSearchQuery}
          filters={filters}
          onFilterChange={setFilterValues}
          placeholder="Search schemes by name, code, ministry, or department..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Schemes</p>
              <p className="text-2xl font-bold text-gray-900">{schemes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {schemes.filter((s) => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Central Sector</p>
              <p className="text-2xl font-bold text-gray-900">
                {schemes.filter((s) => s.scheme_type === "Central Sector").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Centrally Sponsored</p>
              <p className="text-2xl font-bold text-gray-900">
                {schemes.filter((s) => s.scheme_type === "Centrally Sponsored").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredSchemes}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No schemes found. Create your first scheme to get started."
        />
      </div>
    </div>
  );
}
