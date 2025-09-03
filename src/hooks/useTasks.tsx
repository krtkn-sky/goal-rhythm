import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  name: string;
  date: string;
  time?: string;
  isAllDay: boolean;
  link?: string;
  location?: string;
  details?: string;
  completed: boolean;
  createdAt: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const transformedTasks: Task[] = data?.map(t => ({
        id: t.id,
        name: t.name,
        date: t.date,
        time: t.time,
        isAllDay: t.is_all_day,
        link: t.link,
        location: t.location,
        details: t.details,
        completed: t.completed,
        createdAt: t.created_at
      })) || [];

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          name: task.name,
          date: task.date,
          time: task.time,
          is_all_day: task.isAllDay,
          link: task.link,
          location: task.location,
          details: task.details,
          completed: task.completed
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        name: data.name,
        date: data.date,
        time: data.time,
        isAllDay: data.is_all_day,
        link: data.link,
        location: data.location,
        details: data.details,
        completed: data.completed,
        createdAt: data.created_at
      };

      setTasks(prev => [...prev, newTask].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          name: updates.name,
          date: updates.date,
          time: updates.time,
          is_all_day: updates.isAllDay,
          link: updates.link,
          location: updates.location,
          details: updates.details,
          completed: updates.completed
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask
  };
};