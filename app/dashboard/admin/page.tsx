"use client";

import Link from "next/link";
import { Building2, Users, Briefcase } from "lucide-react";

export default function AdminPage() {
  const modules = [
    {
      name: "Ministries",
      description: "Manage government ministries",
      href: "/dashboard/admin/ministries",
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      name: "Departments",
      description: "Manage departments within ministries",
      href: "/dashboard/admin/departments",
      icon: Briefcase,
      color: "bg-green-500",
    },
    {
      name: "Users",
      description: "Manage users and assign roles",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-1">
          Manage organizational structure and user access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`inline-flex p-3 rounded-lg ${module.color} mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {module.name}
              </h2>
              <p className="text-sm text-gray-600">{module.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
