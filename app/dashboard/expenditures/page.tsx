"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, Ministry, Department, BudgetType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canRecordExpenditure } from "@/lib/utils/authorization";
import { formatINR, formatDate, getCurrentFinancialYear } from "@/lib/utils/formatters";
import {
  Button,
  DataTable,
  Column,
  Badge,
  useToast,
  Select,
  SearchFilter,
  FilterConfig,
} from "@/components/ui";

interface Expenditure {
  id: string;
  scheme_id: string;
  ministry_id: string;
  department_id: string | null;
  financial_year: string;
  month: number;
  amount: number;
  expenditure_type: BudgetType;
  description: string;
  transaction_date: string;
  voucher_number: string;
  created_at: string;
  scheme?: Scheme;
  ministry?: Ministry;
  department?: Department;
}

export default function ExpendituresPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();

  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    fetchExpenditures();
  }, [selectedFY, profile]);

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

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("expenditures")
        .select(`
          *,
          scheme:schemes(id, name, code),
          ministry:ministries(id, name),
          department:departments(id, name)
        `)
        .eq("financial_year", selectedFY);

      // Filter by user's ministry/department
      if (profile?.ministry_id && profile?.role !== "Finance Ministry Admin") {
        query = query.eq("ministry_id", profile.ministry_id);
      }

      const { data, error } = await query.order("transaction_date", { ascending: false });

      if (error) throw error;
      setExpenditures(data || []);
    } catch (error: any) {
      console.error("Error fetching expenditures:", error);
      toast.error(error.message || "Failed to fetch expenditures");
    } finally {
      setLoading(false);
    }
  };

  const filters: FilterConfig[] = [
    {
      key: "scheme_id",
      label: "Scheme",
      type: "select",
      options: schemes.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      key: "expenditure_type",
      label: "Type",
      type: "select",
      options: [
        { value: "Capital", label: "Capital" },
        { value: "Revenue", label: "Revenue" },
        { value: "Administrative", label: "Administrative" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "month",
      label: "Month",
      type: "select",
      options: Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: new Date(2000, i).toLocaleString("default", { month: "long" }),
      })),
    },
  ];

  const filteredExpenditures = expenditures.filter((exp) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        exp.voucher_number.toLowerCase().includes(query) ||
        exp.scheme?.name.toLowerCase().includes(query) ||
        exp.description.toLowerCase().includes(query);
      if (!matches) return false;
    }

    if (filterValues.scheme_id && exp.scheme_id !== filterValues.scheme_id) return false;
    if (filterValues.expenditure_type && exp.expenditure_type !== filterValues.expenditure_type) return false;
    if (filterValues.month && exp.month !== parseInt(filterValues.month)) return false;

    return true;
  });

  const columns: Column<Expenditure>[] = [
    {
      key: "transaction_date",
      header: "Date",
      sortable: true,
      render: (value) => <span className="text-sm">{formatDate(value)}</span>,
    },
    {
      key: "voucher_number",
      header: "Voucher",
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: "scheme",
      header: "Scheme",
      render: (value: Scheme | undefined) => <span className="text-sm">{value?.name || "N/A"}</span>,
    },
    {
      key: "expenditure_type",
      header: "Type",
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (value) => <span className="font-medium">{formatINR(value)}</span>,
    },
    {
      key: "month",
      header: "Month",
      render: (value) => (
        <span className="text-sm">{new Date(2000, value - 1).toLocaleString("default", { month: "short" })}</span>
      ),
    },
  ];

  const stats = {
    total: expenditures.length,
    totalAmount: expenditures.reduce((sum, e) => sum + e.amount, 0),
    capital: expenditures.filter((e) => e.expenditure_type === "Capital").reduce((sum, e) => sum + e.amount, 0),
    revenue: expenditures.filter((e) => e.expenditure_type === "Revenue").reduce((sum, e) => sum + e.amount, 0),
  };

  const canRecord = profile && canRecordExpenditure(profile);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenditure Tracking</h1>
          <p className="text-gray-600 mt-1">Track and monitor budget expenditures for FY {selectedFY}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            options={[
              { value: "2025-26", label: "FY 2025-26" },
              { value: "2024-25", label: "FY 2024-25" },
            ]}
          />
          {canRecord && (
            <Link href="/dashboard/expenditures/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Expenditure
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
          placeholder="Search by voucher number, scheme, or description..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Expenditure</p>
          <p className="text-2xl font-bold text-blue-600">{formatINR(stats.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Capital</p>
          <p className="text-2xl font-bold text-green-600">{formatINR(stats.capital)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-purple-600">{formatINR(stats.revenue)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredExpenditures}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage={`No expenditures recorded for FY ${selectedFY}`}
        />
      </div>
    </div>
  );
}
