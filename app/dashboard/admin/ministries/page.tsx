"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ministry } from "@/types";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils/formatters";
import { Button, DataTable, Badge, useToast } from "@/components/ui";
import type { Column } from "@/components/ui";

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .order("name");

      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error("Error fetching ministries:", error);
      toast.error("Failed to load ministries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ministry?")) return;

    try {
      const { error } = await supabase.from("ministries").delete().eq("id", id);

      if (error) throw error;
      setMinistries(ministries.filter((m) => m.id !== id));
      toast.success("Ministry deleted successfully");
    } catch (error: any) {
      console.error("Error deleting ministry:", error);
      toast.error(error.message || "Failed to delete ministry");
    }
  };

  const filteredMinistries = ministries.filter(
    (ministry) =>
      ministry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ministry.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Ministry>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (value) => <span className="text-gray-500">{value}</span>,
    },
    {
      key: "minister_name",
      header: "Minister",
      render: (value) => <span className="text-gray-900">{value || "-"}</span>,
    },
    {
      key: "secretary_name",
      header: "Secretary",
      render: (value) => <span className="text-gray-900">{value || "-"}</span>,
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
      className: "text-right",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => router.push(`/dashboard/admin/ministries/${row.id}/edit`)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900 transition-colors"
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ministries</h1>
          <p className="text-gray-600 mt-1">Manage government ministries</p>
        </div>
        <Link href="/dashboard/admin/ministries/new">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Add Ministry
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <input
          type="text"
          placeholder="Search ministries by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <DataTable
        data={filteredMinistries}
        columns={columns}
        keyField="id"
        loading={loading}
        emptyMessage="No ministries found"
      />
    </div>
  );
}
