"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Department, Ministry } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canManageMinistry, isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  DataTable,
  Column,
  Badge,
  LoadingSpinner,
  useToast,
  SearchFilter,
  FilterConfig,
} from "@/components/ui";

interface DepartmentWithMinistry extends Department {
  ministry?: Ministry;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [departments, setDepartments] = useState<DepartmentWithMinistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  // Check authorization
  useEffect(() => {
    if (profile && !isAdmin(profile)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  // Fetch ministries for filter
  useEffect(() => {
    fetchMinistries();
  }, []);

  // Fetch departments
  useEffect(() => {
    if (profile) {
      fetchDepartments();
    }
  }, [profile]);

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
      setLoading(true);
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          ministry:ministries(*)
        `)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      toast.error(error.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast.error(error.message || "Failed to delete department");
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
  const filteredDepartments = departments.filter((dept) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query) ||
        dept.ministry?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Apply filters
    if (filterValues.ministry_id && dept.ministry_id !== filterValues.ministry_id) {
      return false;
    }
    if (filterValues.is_active && dept.is_active.toString() !== filterValues.is_active) {
      return false;
    }

    return true;
  });

  // Table columns
  const columns: Column<DepartmentWithMinistry>[] = [
    {
      key: "name",
      header: "Department Name",
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
            onClick={() => router.push(`/dashboard/admin/departments/${row.id}/edit`)}
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

  if (!profile || !isAdmin(profile)) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">
            Manage departments within ministries
          </p>
        </div>
        <Link href="/dashboard/admin/departments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilter
          onSearch={setSearchQuery}
          filters={filters}
          onFilterChange={setFilterValues}
          placeholder="Search departments by name, code, or ministry..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
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
                {departments.filter((d) => d.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments.filter((d) => !d.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredDepartments}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No departments found. Create your first department to get started."
        />
      </div>
    </div>
  );
}
