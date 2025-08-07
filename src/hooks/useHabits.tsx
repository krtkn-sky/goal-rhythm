import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  frequency?: 'daily' | 'weekly';
  weeklyDays?: number[];
}

export interface StreakData {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface DeletedHabit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  deletedAt: string;
  longestStreak: number;
  totalDays: number;
  frequency?: 'daily' | 'weekly';
  weeklyDays?: number[];
}

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [deletedHabits, setDeletedHabits] = useState<DeletedHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load user's habits and completions
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setHabits([]);
      setStreakData([]);
      setDeletedHabits([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Load deleted habits
      const { data: deletedHabitsData, error: deletedError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (deletedError) throw deletedError;

      // Load completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id);

      if (completionsError) throw completionsError;

      // Transform data to match existing interfaces
      const transformedHabits: Habit[] = habitsData?.map(h => ({
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        createdAt: h.created_at,
        frequency: (h.frequency as 'daily' | 'weekly') || 'daily',
        weeklyDays: h.weekly_days
      })) || [];

      const transformedStreaks: StreakData[] = completionsData?.map(c => ({
        habitId: c.habit_id,
        date: c.completed_date,
        completed: c.completed ?? true // Handle legacy data that might not have completed field
      })) || [];

      const transformedDeleted: DeletedHabit[] = deletedHabitsData?.map(h => ({
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        createdAt: h.created_at,
        deletedAt: h.deleted_at || new Date().toISOString(),
        frequency: (h.frequency as 'daily' | 'weekly') || 'daily',
        weeklyDays: h.weekly_days,
        longestStreak: 0, // Calculate these if needed
        totalDays: 0
      })) || [];

      setHabits(transformedHabits);
      setStreakData(transformedStreaks);
      setDeletedHabits(transformedDeleted);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (habit: Omit<Habit, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          frequency: habit.frequency || 'daily',
          weekly_days: habit.weeklyDays,
          created_at: habit.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        id: data.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        createdAt: data.created_at,
        frequency: (data.frequency as 'daily' | 'weekly') || 'daily',
        weeklyDays: data.weekly_days
      };

      setHabits(prev => [...prev, newHabit]);
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move from habits to deleted habits
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const deletedHabit: DeletedHabit = {
          ...habit,
          deletedAt: new Date().toISOString(),
          longestStreak: 0,
          totalDays: 0
        };
        
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setDeletedHabits(prev => [deletedHabit, ...prev]);
        setStreakData(prev => prev.filter(s => s.habitId !== habitId));
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const restoreHabit = async (deletedHabit: DeletedHabit) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: deletedHabit.name,
          color: deletedHabit.color,
          icon: deletedHabit.icon,
          frequency: deletedHabit.frequency || 'daily',
          weekly_days: deletedHabit.weeklyDays
        })
        .select()
        .single();

      if (error) throw error;

      const restoredHabit: Habit = {
        id: data.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        createdAt: data.created_at,
        frequency: (data.frequency as 'daily' | 'weekly') || 'daily',
        weeklyDays: data.weekly_days
      };

      setHabits(prev => [...prev, restoredHabit]);
      setDeletedHabits(prev => prev.filter(h => 
        !(h.id === deletedHabit.id && h.deletedAt === deletedHabit.deletedAt)
      ));
    } catch (error) {
      console.error('Error restoring habit:', error);
    }
  };

  const toggleHabitCompletion = async (habitId: string, date: string, forceCompleted?: boolean) => {
    if (!user) return;

    try {
      const existingEntry = streakData.find(s => s.habitId === habitId && s.date === date);
      
      // If forceCompleted is specified, use that value, otherwise toggle
      let newCompletedState: boolean;
      if (forceCompleted !== undefined) {
        newCompletedState = forceCompleted;
      } else {
        // Toggle: if exists and completed, remove; if doesn't exist, add as completed
        newCompletedState = !existingEntry?.completed;
      }

      // Always delete existing entry first
      if (existingEntry) {
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', date)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Update local state by removing existing entry
      setStreakData(prev => prev.filter(s => !(s.habitId === habitId && s.date === date)));

      // Add new entry if needed (both for completed=true and completed=false)
      if (existingEntry || newCompletedState) {
        const { error: insertError } = await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            completed_date: date,
            completed: newCompletedState
          });

        if (insertError) throw insertError;

        // Update local state with new entry
        setStreakData(prev => [...prev, { habitId, date, completed: newCompletedState }]);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
    }
  };

  return {
    habits,
    streakData,
    deletedHabits,
    loading,
    setHabits,
    setStreakData,
    setDeletedHabits,
    addHabit,
    deleteHabit,
    restoreHabit,
    toggleHabitCompletion
  };
};