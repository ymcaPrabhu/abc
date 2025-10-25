"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR, formatDate, getCurrentFinancialYear } from "@/lib/utils/formatters";
import {
  Button,
  Select,
  FormField,
  Card,
  useToast,
} from "@/components/ui";

export default function ReportsPage() {
  const { profile } = useAuth();
  const toast = useToast();

  const [reportType, setReportType] = useState("budget_summary");
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    try {
      setLoading(true);

      if (reportType === "budget_summary") {
        await generateBudgetSummary();
      } else if (reportType === "expenditure_report") {
        await generateExpenditureReport();
      } else if (reportType === "ministry_wise") {
        await generateMinistryWiseReport();
      }

      toast.success("Report generated successfully");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const generateBudgetSummary = async () => {
    const { data: proposals, error } = await supabase
      .from("budget_proposals")
      .select(`
        *,
        scheme:schemes(name),
        ministry:ministries(name)
      `)
      .eq("financial_year", financialYear);

    if (error) throw error;

    const summary = {
      totalProposals: proposals?.length || 0,
      totalAmount: proposals?.reduce((sum, p) => sum + p.total_amount, 0) || 0,
      approved: proposals?.filter((p) => p.status === "Approved").length || 0,
      pending: proposals?.filter((p) => p.status === "Submitted").length || 0,
      rejected: proposals?.filter((p) => p.status === "Rejected").length || 0,
      proposals: proposals || [],
    };

    setReportData(summary);
  };

  const generateExpenditureReport = async () => {
    const { data: expenditures, error } = await supabase
      .from("expenditures")
      .select(`
        *,
        scheme:schemes(name),
        ministry:ministries(name)
      `)
      .eq("financial_year", financialYear);

    if (error) throw error;

    const summary = {
      totalExpenditures: expenditures?.length || 0,
      totalAmount: expenditures?.reduce((sum, e) => sum + e.amount, 0) || 0,
      capital: expenditures?.filter((e) => e.expenditure_type === "Capital").reduce((sum, e) => sum + e.amount, 0) || 0,
      revenue: expenditures?.filter((e) => e.expenditure_type === "Revenue").reduce((sum, e) => sum + e.amount, 0) || 0,
      expenditures: expenditures || [],
    };

    setReportData(summary);
  };

  const generateMinistryWiseReport = async () => {
    const { data: ministries, error: ministriesError } = await supabase
      .from("ministries")
      .select("*")
      .eq("is_active", true);

    if (ministriesError) throw ministriesError;

    const ministryData = await Promise.all(
      (ministries || []).map(async (ministry) => {
        const { data: proposals } = await supabase
          .from("budget_proposals")
          .select("total_amount, status")
          .eq("ministry_id", ministry.id)
          .eq("financial_year", financialYear);

        const { data: expenditures } = await supabase
          .from("expenditures")
          .select("amount")
          .eq("ministry_id", ministry.id)
          .eq("financial_year", financialYear);

        return {
          ministry: ministry.name,
          proposals: proposals?.length || 0,
          budgetRequested: proposals?.reduce((sum, p) => sum + p.total_amount, 0) || 0,
          approved: proposals?.filter((p) => p.status === "Approved").length || 0,
          expenditure: expenditures?.reduce((sum, e) => sum + e.amount, 0) || 0,
        };
      })
    );

    setReportData({ ministries: ministryData });
  };

  const exportToCSV = () => {
    if (!reportData) {
      toast.error("Please generate a report first");
      return;
    }

    let csv = "";

    if (reportType === "budget_summary" && reportData.proposals) {
      csv = "Proposal Number,Scheme,Ministry,Type,Amount,Status,Created Date\n";
      reportData.proposals.forEach((p: any) => {
        csv += `${p.proposal_number},${p.scheme?.name || ""},${p.ministry?.name || ""},${p.proposal_type},${p.total_amount},${p.status},${formatDate(p.created_at)}\n`;
      });
    } else if (reportType === "expenditure_report" && reportData.expenditures) {
      csv = "Voucher Number,Scheme,Type,Amount,Date\n";
      reportData.expenditures.forEach((e: any) => {
        csv += `${e.voucher_number},${e.scheme?.name || ""},${e.expenditure_type},${e.amount},${formatDate(e.transaction_date)}\n`;
      });
    } else if (reportType === "ministry_wise" && reportData.ministries) {
      csv = "Ministry,Proposals,Budget Requested,Approved,Expenditure\n";
      reportData.ministries.forEach((m: any) => {
        csv += `${m.ministry},${m.proposals},${m.budgetRequested},${m.approved},${m.expenditure}\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_${financialYear}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and export financial reports</p>
      </div>

      {/* Report Configuration */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Report Type">
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: "budget_summary", label: "Budget Summary" },
                { value: "expenditure_report", label: "Expenditure Report" },
                { value: "ministry_wise", label: "Ministry-wise Analysis" },
              ]}
            />
          </FormField>

          <FormField label="Financial Year">
            <Select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              options={[
                { value: "2025-26", label: "FY 2025-26" },
                { value: "2024-25", label: "FY 2024-25" },
                { value: "2023-24", label: "FY 2023-24" },
              ]}
            />
          </FormField>

          <div className="flex items-end">
            <Button onClick={generateReport} isLoading={loading} fullWidth>
              <Filter className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Report Results</h2>
            <Button onClick={exportToCSV} variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>

          {/* Budget Summary */}
          {reportType === "budget_summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.totalProposals}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{reportData.approved}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{reportData.pending}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-900">{formatINR(reportData.totalAmount)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proposal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheme</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.proposals.slice(0, 10).map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{p.proposal_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{p.scheme?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatINR(p.total_amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.proposals.length > 10 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Showing 10 of {reportData.proposals.length} proposals. Export to CSV for full data.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Expenditure Report */}
          {reportType === "expenditure_report" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Total Expenditures</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.totalExpenditures}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Capital</p>
                  <p className="text-2xl font-bold text-green-900">{formatINR(reportData.capital)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Revenue</p>
                  <p className="text-2xl font-bold text-purple-900">{formatINR(reportData.revenue)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ministry-wise Report */}
          {reportType === "ministry_wise" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proposals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenditure</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.ministries.map((m: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{m.ministry}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{m.proposals}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatINR(m.budgetRequested)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{m.approved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatINR(m.expenditure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!reportData && (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500">
              Select a report type and financial year, then click "Generate Report"
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
