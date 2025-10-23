"use client";

import { Task } from "@/app/page";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg shadow-md p-4 flex items-start gap-4 hover:shadow-lg transition-shadow"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <h3
              className={`font-semibold text-lg ${
                task.completed ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`mt-1 text-sm ${
                  task.completed ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {task.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(task.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
