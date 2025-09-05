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
  difficulty?: 'easy' | 'medium' | 'hard';
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
  difficulty?: 'easy' | 'medium' | 'hard';
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
        weeklyDays: h.weekly_days,
        difficulty: (h.difficulty as 'easy' | 'medium' | 'hard') || 'easy'
      })) || [];

      const transformedStreaks: StreakData[] = completionsData?.map(c => ({
        habitId: c.habit_id,
        date: c.completed_date,
        completed: (c as any).completed ?? true // Handle legacy data that might not have completed field
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
        difficulty: (h.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
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
          difficulty: habit.difficulty || 'easy',
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
        weeklyDays: data.weekly_days,
        difficulty: (data.difficulty as 'easy' | 'medium' | 'hard') || 'easy'
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
          weekly_days: deletedHabit.weeklyDays,
          difficulty: deletedHabit.difficulty || 'easy'
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
        weeklyDays: data.weekly_days,
        difficulty: (data.difficulty as 'easy' | 'medium' | 'hard') || 'easy'
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
      // Always try to delete any existing entry in DB first
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', date)
        .eq('user_id', user.id);
      if (deleteError) {
        // If deletion of non-existent row, Supabase returns no error, so this is safe
        // Only log severe errors
        if ((deleteError as any)?.code && (deleteError as any)?.code !== 'PGRST116') {
          throw deleteError;
        }
      }

      // Update local state immediately for instant UI feedback
      setStreakData(prev => {
        // Remove any existing entry for this habit and date
        const filtered = prev.filter(s => !(s.habitId === habitId && s.date === date));
        
        // If forceCompleted is undefined, this is a CLEAR action; don't add anything
        if (forceCompleted === undefined) {
          return filtered;
        }
        
        // Add new entry with the specified completion state
        return [...filtered, { habitId, date, completed: forceCompleted }];
      });

      // If forceCompleted is undefined, this is a CLEAR action; don't insert anything
      if (forceCompleted === undefined) {
        return;
      }

      // Insert new state (true for Done, false for Miss)
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          completed_date: date,
          completed: forceCompleted
        });
      if (insertError) throw insertError;

    } catch (error) {
      console.error('Error toggling habit completion:', error);
      // Reload data on error to ensure consistency
      loadUserData();
    }
  };

  // Calculate score helper function
  const getHabitPoints = (difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  };

  // Calculate lifetime score
  const calculateLifetimeScore = () => {
    let score = 0;
    
    // Add points for completed habits
    streakData.forEach(streak => {
      const habit = habits.find(h => h.id === streak.habitId);
      if (habit && streak.completed) {
        score += getHabitPoints(habit.difficulty);
      } else if (habit && streak.completed === false) {
        score -= getHabitPoints(habit.difficulty);
      }
    });
    
    return Math.max(0, score); // Don't allow negative scores
  };

  const lifetimeScore = calculateLifetimeScore();

  return {
    habits,
    streakData,
    deletedHabits,
    loading,
    lifetimeScore,
    setHabits,
    setStreakData,
    setDeletedHabits,
    addHabit,
    deleteHabit,
    restoreHabit,
    toggleHabitCompletion,
    getHabitPoints
  };
};