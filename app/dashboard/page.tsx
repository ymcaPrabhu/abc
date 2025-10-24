"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, getCurrentFinancialYear } from "@/lib/utils/formatters";
import {
  Building2,
  FileText,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface DashboardStats {
  totalMinistries: number;
  totalSchemes: number;
  totalBudgetProposals: number;
  pendingApprovals: number;
  totalAllocated: number;
  totalExpenditure: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMinistries: 0,
    totalSchemes: 0,
    totalBudgetProposals: 0,
    pendingApprovals: 0,
    totalAllocated: 0,
    totalExpenditure: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      const currentFY = getCurrentFinancialYear();

      // Fetch ministries count
      const { count: ministriesCount } = await supabase
        .from("ministries")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch schemes count
      const { count: schemesCount } = await supabase
        .from("schemes")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch budget proposals count
      const { count: proposalsCount } = await supabase
        .from("budget_proposals")
        .select("*", { count: "exact", head: true })
        .eq("financial_year", currentFY);

      // Fetch pending approvals count
      const { count: pendingCount } = await supabase
        .from("budget_proposals")
        .select("*", { count: "exact", head: true })
        .in("status", ["Submitted", "Under Review"]);

      // Fetch total allocated
      const { data: allocationsData } = await supabase
        .from("budget_allocations")
        .select("sanctioned_amount")
        .eq("financial_year", currentFY)
        .eq("status", "Active");

      const totalAllocated = allocationsData?.reduce(
        (sum, item) => sum + parseFloat(item.sanctioned_amount || "0"),
        0
      ) || 0;

      // Fetch total expenditure
      const { data: expendituresData } = await supabase
        .from("expenditures")
        .select("amount")
        .eq("financial_year", currentFY);

      const totalExpenditure = expendituresData?.reduce(
        (sum, item) => sum + parseFloat(item.amount || "0"),
        0
      ) || 0;

      setStats({
        totalMinistries: ministriesCount || 0,
        totalSchemes: schemesCount || 0,
        totalBudgetProposals: proposalsCount || 0,
        pendingApprovals: pendingCount || 0,
        totalAllocated,
        totalExpenditure,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const utilizationPercentage = stats.totalAllocated > 0
    ? ((stats.totalExpenditure / stats.totalAllocated) * 100).toFixed(1)
    : "0.0";

  const statCards = [
    {
      name: "Ministries",
      value: stats.totalMinistries,
      icon: Building2,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Active Schemes",
      value: stats.totalSchemes,
      icon: FileText,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Budget Proposals",
      value: stats.totalBudgetProposals,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.full_name || profile?.email}
        </h1>
        <p className="text-gray-600 mt-1">
          Financial Year: {getCurrentFinancialYear()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Budget Allocation
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Allocated</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(stats.totalAllocated)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Expenditure</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(stats.totalExpenditure)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Remaining</span>
                <span className="font-semibold text-gray-900">
                  {formatINR(stats.totalAllocated - stats.totalExpenditure)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Budget Utilization
          </h2>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 56 * (1 - parseFloat(utilizationPercentage) / 100)
                    }`}
                    className="text-blue-600"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {utilizationPercentage}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                of allocated budget utilized
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/schemes/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Create Scheme</div>
              <div className="text-sm text-gray-500">Add a new government scheme</div>
            </div>
          </a>
          <a
            href="/dashboard/budgets/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Create Proposal</div>
              <div className="text-sm text-gray-500">Submit a budget proposal</div>
            </div>
          </a>
          <a
            href="/dashboard/expenditures/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wallet className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Record Expenditure</div>
              <div className="text-sm text-gray-500">Log actual spending</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
