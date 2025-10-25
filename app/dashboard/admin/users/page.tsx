"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserRole, Ministry, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  SearchFilter,
  FilterConfig,
} from "@/components/ui";

interface UserWithRelations extends UserProfile {
  ministry?: Ministry;
  department?: Department;
}

export default function UsersPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  useEffect(() => {
    if (profile && !isAdmin(profile)) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [profile, router, toast]);

  useEffect(() => {
    fetchMinistries();
    fetchUsers();
  }, []);

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .order("name");

      if (error) throw error;
      setMinistries(data || []);
    } catch (error: any) {
      console.error("Error fetching ministries:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          *,
          ministry:ministries(id, name),
          department:departments(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filters: FilterConfig[] = [
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "Finance Ministry Admin", label: "Finance Ministry Admin" },
        { value: "Budget Division Officer", label: "Budget Division Officer" },
        { value: "Ministry Secretary", label: "Ministry Secretary" },
        { value: "Department Head", label: "Department Head" },
        { value: "Section Officer", label: "Section Officer" },
        { value: "Auditor", label: "Auditor" },
      ],
    },
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

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query);
      if (!matches) return false;
    }

    if (filterValues.role && user.role !== filterValues.role) return false;
    if (filterValues.ministry_id && user.ministry_id !== filterValues.ministry_id) return false;
    if (filterValues.is_active && user.is_active.toString() !== filterValues.is_active) return false;

    return true;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === "Finance Ministry Admin") return "danger";
    if (role === "Budget Division Officer") return "warning";
    if (role === "Ministry Secretary") return "info";
    if (role === "Department Head") return "success";
    return "outline";
  };

  const columns: Column<UserWithRelations>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value || "Not set"}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (value: UserRole) => (
        <Badge variant={getRoleBadgeVariant(value)}>{value}</Badge>
      ),
    },
    {
      key: "ministry",
      header: "Ministry",
      render: (value: Ministry | undefined) => (
        <span className="text-sm text-gray-700">{value?.name || "-"}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (value: Department | undefined) => (
        <span className="text-sm text-gray-700">{value?.name || "-"}</span>
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
        <button
          onClick={() => router.push(`/dashboard/admin/users/${row.id}/edit`)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Edit User"
        >
          <Edit className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === "Finance Ministry Admin").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage users and assign roles</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <SearchFilter
          onSearch={setSearchQuery}
          filters={filters}
          onFilterChange={setFilterValues}
          placeholder="Search users by name or email..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredUsers}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No users found"
        />
      </div>
    </div>
  );
}
