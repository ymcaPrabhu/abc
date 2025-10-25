"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Calendar, Building2, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Scheme, Ministry, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { canCreateBudgetProposal } from "@/lib/utils/authorization";
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  useToast,
} from "@/components/ui";

interface SchemeWithRelations extends Scheme {
  ministry?: Ministry;
  department?: Department;
}

export default function SchemeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const schemeId = params.id as string;

  const [scheme, setScheme] = useState<SchemeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId]);

  const fetchScheme = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("schemes")
        .select(`
          *,
          ministry:ministries(id, name, code),
          department:departments(id, name, code)
        `)
        .eq("id", schemeId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Scheme not found");
        router.push("/dashboard/schemes");
        return;
      }

      setScheme(data);
    } catch (error: any) {
      console.error("Error fetching scheme:", error);
      toast.error(error.message || "Failed to fetch scheme");
      router.push("/dashboard/schemes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this scheme? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("schemes")
        .delete()
        .eq("id", schemeId);

      if (error) throw error;

      toast.success("Scheme deleted successfully");
      router.push("/dashboard/schemes");
    } catch (error: any) {
      console.error("Error deleting scheme:", error);
      toast.error(error.message || "Failed to delete scheme. It may be in use by budget proposals.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!scheme) {
    return null;
  }

  const canEdit = profile && canCreateBudgetProposal(profile);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schemes
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{scheme.name}</h1>
              <Badge variant={scheme.is_active ? "success" : "danger"}>
                {scheme.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1 font-mono">{scheme.code}</p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/schemes/${scheme.id}/edit`}>
                <Button variant="secondary">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheme Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">{scheme.scheme_type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={scheme.is_active ? "success" : "danger"}>
                      {scheme.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {scheme.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{scheme.description}</p>
                </div>
              )}

              {scheme.objectives && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Objectives</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{scheme.objectives}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          {(scheme.start_date || scheme.end_date) && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="grid grid-cols-2 gap-4">
                {scheme.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </label>
                    <p className="mt-1 text-gray-900">
                      {new Date(scheme.start_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {scheme.end_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </label>
                    <p className="mt-1 text-gray-900">
                      {new Date(scheme.end_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ministry & Department */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Organization
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Ministry
                </label>
                <p className="mt-1 text-gray-900">{scheme.ministry?.name || "N/A"}</p>
                <p className="text-sm text-gray-500 font-mono">{scheme.ministry?.code}</p>
              </div>

              {scheme.department && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Department
                  </label>
                  <p className="mt-1 text-gray-900">{scheme.department.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{scheme.department.code}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Created</label>
                <p className="text-gray-900">
                  {new Date(scheme.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-gray-500">Last Updated</label>
                <p className="text-gray-900">
                  {new Date(scheme.updated_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-gray-500">Scheme ID</label>
                <p className="text-gray-900 font-mono text-xs">{scheme.id}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          {canEdit && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link href={`/dashboard/budgets/new?scheme_id=${scheme.id}`}>
                  <Button variant="secondary" fullWidth>
                    Create Budget Proposal
                  </Button>
                </Link>
                <Link href={`/dashboard/schemes/${scheme.id}/edit`}>
                  <Button variant="outline" fullWidth>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Scheme
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
