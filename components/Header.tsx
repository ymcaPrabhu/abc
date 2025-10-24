"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Task Organizer
            </h1>
            <p className="text-sm text-gray-600">Team Dashboard</p>
          </div>

          {profile && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-gray-600">{profile.role}</p>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
