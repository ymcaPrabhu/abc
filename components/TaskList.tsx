"use client";

import { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  currentUserId: string;
}

export default function TaskList({ tasks, onToggle, onDelete, currentUserId }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isOwner = task.user_id === currentUserId;
        const userName = task.user_profile
          ? task.user_profile.full_name || task.user_profile.email
          : "Unknown User";
        const userRole = task.user_profile?.role || "";

        return (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => onToggle(task.id, e.target.checked)}
                disabled={!isOwner}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isOwner ? "Toggle task completion" : "Only task owner can toggle"}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-semibold text-lg ${
                      task.completed ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {task.description && (
                  <p
                    className={`mt-1 text-sm ${
                      task.completed ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{userName}</span>
                    {userRole && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {userRole}
                      </span>
                    )}
                  </div>
                  <span>•</span>
                  <span>{new Date(task.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
