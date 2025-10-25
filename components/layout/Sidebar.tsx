"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Wallet,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  CheckCircle,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, hasRole } from "@/lib/utils/authorization";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Schemes", href: "/dashboard/schemes", icon: Building2 },
  { name: "Budget Proposals", href: "/dashboard/budgets", icon: FileText },
  { name: "Budget Allocations", href: "/dashboard/allocations", icon: DollarSign },
  { name: "Expenditures", href: "/dashboard/expenditures", icon: Wallet },
  { name: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  {
    name: "Admin",
    href: "/dashboard/admin",
    icon: Settings,
    roles: ["Finance Ministry Admin"]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return profile && hasRole(profile, item.roles as any);
  });

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-white text-xl font-bold">IBMS</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="text-xs text-gray-400">Signed in as</div>
          <div className="text-sm text-white font-medium truncate">
            {profile.full_name || profile.email}
          </div>
          <div className="text-xs text-gray-400 mt-1">{profile.role}</div>
        </div>
      )}
    </div>
  );
}
