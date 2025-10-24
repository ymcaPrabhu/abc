"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Scheme } from "@/types";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching schemes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schemes</h1>
          <p className="text-gray-600 mt-1">Government schemes and programs</p>
        </div>
        <Link
          href="/dashboard/schemes/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Scheme
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No schemes found. Create your first scheme to get started.</p>
          </div>
        ) : (
          schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {scheme.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    scheme.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {scheme.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{scheme.code}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Ministry:</span>
                  <span className="ml-2 text-gray-900">
                    {scheme.ministry?.name || "-"}
                  </span>
                </div>
                {scheme.department && (
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 text-gray-900">
                      {scheme.department.name}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 text-gray-900">{scheme.scheme_type}</span>
                </div>
              </div>
              <Link
                href={`/dashboard/schemes/${scheme.id}`}
                className="mt-4 block text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
