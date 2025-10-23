"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (title: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ title, description, completed: false }])
        .select();

      if (error) throw error;
      if (data) {
        setTasks([data[0], ...tasks]);
      }
    } catch (error) {
      console.error("Error adding task:", error);
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
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        Task Organizer
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <TaskForm onAdd={addTask} />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      )}
    </main>
  );
}
