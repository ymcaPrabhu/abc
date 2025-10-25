"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Lock, Unlock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BudgetAllocation, Scheme, BudgetProposal, Expenditure } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, formatDate, formatFullINR } from "@/lib/utils/formatters";
import { isAdmin } from "@/lib/utils/authorization";
import {
  Button,
  Card,
  Badge,
  useToast,
  DataTable,
  Column,
  Input,
  FormField,
} from "@/components/ui";

interface AllocationWithRelations extends BudgetAllocation {
  scheme?: Scheme;
  proposal?: BudgetProposal;
}

export default function AllocationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const toast = useToast();

  const [allocation, setAllocation] = useState<AllocationWithRelations | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    sanctioned_amount: "",
    q1_allocation: "",
    q2_allocation: "",
    q3_allocation: "",
    q4_allocation: "",
  });

  const allocationId = params.id;

  useEffect(() => {
    if (allocationId) {
      fetchAllocation();
      fetchExpenditures();
    }
  }, [allocationId]);

  const fetchAllocation = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("budget_allocations")
        .select(`
          *,
          scheme:schemes(*),
          proposal:budget_proposals(*, scheme:schemes(name))
        `)
        .eq("id", allocationId)
        .single();

      if (error) throw error;

      setAllocation(data);
      setEditData({
        sanctioned_amount: data.sanctioned_amount.toString(),
        q1_allocation: data.q1_allocation?.toString() || "",
        q2_allocation: data.q2_allocation?.toString() || "",
        q3_allocation: data.q3_allocation?.toString() || "",
        q4_allocation: data.q4_allocation?.toString() || "",
      });
    } catch (error: any) {
      console.error("Error fetching allocation:", error);
      toast.error(error.message || "Failed to fetch allocation details");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenditures = async () => {
    try {
      const { data, error } = await supabase
        .from("expenditures")
        .select("*")
        .eq("allocation_id", allocationId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setExpenditures(data || []);
    } catch (error: any) {
      console.error("Error fetching expenditures:", error);
    }
  };

  const handleToggleStatus = async () => {
    if (!allocation) return;

    const newStatus = allocation.status === "Active" ? "Frozen" : "Active";

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
      fetchAllocation();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleSave = async () => {
    if (!allocation) return;

    // Validate quarterly total
    const q1 = parseFloat(editData.q1_allocation) || 0;
    const q2 = parseFloat(editData.q2_allocation) || 0;
    const q3 = parseFloat(editData.q3_allocation) || 0;
    const q4 = parseFloat(editData.q4_allocation) || 0;
    const quarterlyTotal = q1 + q2 + q3 + q4;
    const sanctioned = parseFloat(editData.sanctioned_amount) || 0;

    if (quarterlyTotal > 0 && Math.abs(quarterlyTotal - sanctioned) > 0.01) {
      toast.error(`Quarterly allocations (${formatINR(quarterlyTotal)}) must equal sanctioned amount (${formatINR(sanctioned)})`);
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("budget_allocations")
        .update({
          sanctioned_amount: sanctioned,
          q1_allocation: editData.q1_allocation ? parseFloat(editData.q1_allocation) : null,
          q2_allocation: editData.q2_allocation ? parseFloat(editData.q2_allocation) : null,
          q3_allocation: editData.q3_allocation ? parseFloat(editData.q3_allocation) : null,
          q4_allocation: editData.q4_allocation ? parseFloat(editData.q4_allocation) : null,
        })
        .eq("id", allocationId);

      if (error) throw error;

      toast.success("Allocation updated successfully");
      setIsEditing(false);
      fetchAllocation();
    } catch (error: any) {
      console.error("Error updating allocation:", error);
      toast.error(error.message || "Failed to update allocation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="p-6">
        <p>Allocation not found</p>
      </div>
    );
  }

  const canEdit = profile && (isAdmin(profile) || profile.role === "Budget Division Officer");
  const totalExpenditure = expenditures.reduce((sum, e) => sum + e.amount, 0);
  const utilizationPercentage = ((totalExpenditure / allocation.sanctioned_amount) * 100).toFixed(1);

  const expenditureColumns: Column<Expenditure>[] = [
    {
      key: "transaction_date",
      header: "Date",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "voucher_number",
      header: "Voucher #",
      render: (value) => value || "N/A",
    },
    {
      key: "description",
      header: "Description",
      render: (value) => value || "N/A",
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
      render: (value) => formatINR(value),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/allocations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Allocation Details</h1>
            <p className="text-gray-600 mt-1">{allocation.scheme?.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant={allocation.status === "Active" ? "success" : allocation.status === "Frozen" ? "warning" : "outline"}>
            {allocation.status}
          </Badge>
          {canEdit && (
            <>
              {!isEditing && (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleStatus}
              >
                {allocation.status === "Active" ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Freeze
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unfreeze
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Allocation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Allocation Information</h2>

            {isEditing ? (
              <div className="space-y-4">
                <FormField label="Sanctioned Amount (₹)">
                  <Input
                    type="number"
                    value={editData.sanctioned_amount}
                    onChange={(e) => setEditData({ ...editData, sanctioned_amount: e.target.value })}
                    step="0.01"
                    min="0"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Q1 Allocation">
                    <Input
                      type="number"
                      value={editData.q1_allocation}
                      onChange={(e) => setEditData({ ...editData, q1_allocation: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </FormField>
                  <FormField label="Q2 Allocation">
                    <Input
                      type="number"
                      value={editData.q2_allocation}
                      onChange={(e) => setEditData({ ...editData, q2_allocation: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </FormField>
                  <FormField label="Q3 Allocation">
                    <Input
                      type="number"
                      value={editData.q3_allocation}
                      onChange={(e) => setEditData({ ...editData, q3_allocation: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </FormField>
                  <FormField label="Q4 Allocation">
                    <Input
                      type="number"
                      value={editData.q4_allocation}
                      onChange={(e) => setEditData({ ...editData, q4_allocation: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                  </FormField>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} isLoading={saving}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      sanctioned_amount: allocation.sanctioned_amount.toString(),
                      q1_allocation: allocation.q1_allocation?.toString() || "",
                      q2_allocation: allocation.q2_allocation?.toString() || "",
                      q3_allocation: allocation.q3_allocation?.toString() || "",
                      q4_allocation: allocation.q4_allocation?.toString() || "",
                    });
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Proposal Number</span>
                  <Link href={`/dashboard/budgets/${allocation.proposal_id}`} className="text-blue-600 hover:underline">
                    {allocation.proposal?.proposal_number}
                  </Link>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Scheme</span>
                  <span className="font-medium">{allocation.scheme?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Financial Year</span>
                  <span className="font-medium">{allocation.financial_year}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Sanctioned Amount</span>
                  <span className="font-bold text-lg">{formatFullINR(allocation.sanctioned_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Sanctioned On</span>
                  <span className="font-medium">{formatDate(allocation.sanctioned_at)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={allocation.status === "Active" ? "success" : allocation.status === "Frozen" ? "warning" : "outline"}>
                    {allocation.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Utilization Card */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilization</h2>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
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
                    className={
                      parseFloat(utilizationPercentage) > 100
                        ? "text-red-600"
                        : parseFloat(utilizationPercentage) > 75
                        ? "text-orange-600"
                        : "text-green-600"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {utilizationPercentage}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allocated</span>
                <span className="font-medium">{formatINR(allocation.sanctioned_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spent</span>
                <span className="font-medium">{formatINR(totalExpenditure)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining</span>
                <span className="font-medium">{formatINR(allocation.sanctioned_amount - totalExpenditure)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quarterly Breakdown */}
      {!isEditing && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Q1 (Apr-Jun)</p>
                <p className="text-xl font-bold text-blue-600">
                  {allocation.q1_allocation ? formatINR(allocation.q1_allocation) : "Not allocated"}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Q2 (Jul-Sep)</p>
                <p className="text-xl font-bold text-green-600">
                  {allocation.q2_allocation ? formatINR(allocation.q2_allocation) : "Not allocated"}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Q3 (Oct-Dec)</p>
                <p className="text-xl font-bold text-purple-600">
                  {allocation.q3_allocation ? formatINR(allocation.q3_allocation) : "Not allocated"}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Q4 (Jan-Mar)</p>
                <p className="text-xl font-bold text-orange-600">
                  {allocation.q4_allocation ? formatINR(allocation.q4_allocation) : "Not allocated"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Expenditures */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Expenditures</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>{expenditures.length} transactions</span>
            </div>
          </div>
          <DataTable
            data={expenditures}
            columns={expenditureColumns}
            keyField="id"
            emptyMessage="No expenditures recorded yet"
          />
        </div>
      </Card>
    </div>
  );
}
