"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";
import LoginPage from "@/components/LoginPage";
import Header from "@/components/Header";
import { Task } from "@/types";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          user_profile:user_profiles(id, email, full_name, role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our Task type
      const transformedTasks = (data || []).map((task: any) => ({
        ...task,
        user_profile: task.user_profile || undefined
      }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (title: string, description: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{
          title,
          description,
          completed: false,
          user_id: user.id
        }])
        .select(`
          *,
          user_profile:user_profiles(id, email, full_name, role)
        `);

      if (error) throw error;
      if (data && data[0]) {
        const newTask = {
          ...data[0],
          user_profile: data[0].user_profile || undefined
        };
        setTasks([newTask, ...tasks]);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  };

  const toggleTask = async (id: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", id);

      if (error) throw error;
      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed } : task)));
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main app for authenticated users
  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add New Task
          </h2>
          <TaskForm onAdd={addTask} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Team Tasks
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              currentUserId={user.id}
            />
          )}
        </div>
      </main>
    </div>
  );
}
