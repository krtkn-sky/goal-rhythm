import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HabitCalendar from '@/components/HabitCalendar';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Calendar, BarChart3, User, Sparkles, LogOut } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  frequency?: 'daily' | 'weekly';
  weeklyDays?: number[];
}

interface StreakData {
  habitId: string;
  date: string;
  completed: boolean;
}

interface DeletedHabit {
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

const Index = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  
  const { user, userProfile, signOut, loading } = useAuth();
  const { 
    habits, 
    streakData, 
    deletedHabits, 
    loading: habitsLoading,
    setHabits,
    setStreakData,
    setDeletedHabits,
    addHabit,
    deleteHabit: deleteHabitDB,
    restoreHabit: restoreHabitDB,
    toggleHabitCompletion
  } = useHabits();
  const navigate = useNavigate();


  const restoreHabit = (deletedHabit: DeletedHabit) => {
    restoreHabitDB(deletedHabit);
  };

  const permanentlyDeleteHabit = (habitId: string) => {
    setDeletedHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const deleteAllHabits = () => {
    setDeletedHabits([]);
  };


  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  if (loading || habitsLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-4 h-4 text-success-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-success-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Goal Rhythm</h1>
              {user && userProfile && (
                <p className="text-sm text-muted-foreground">Welcome back, {userProfile.username}!</p>
              )}
            </div>
          </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleAuthAction}>
                {user ? (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Sign Up / Login
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-0">
            <HabitCalendar 
              habits={habits}
              streakData={streakData}
              deletedHabits={deletedHabits}
              onHabitsChange={setHabits}
              onStreakDataChange={setStreakData}
              onDeletedHabitsChange={setDeletedHabits}
              onAddHabit={user ? addHabit : undefined}
              onDeleteHabit={user ? deleteHabitDB : undefined}
              onToggleCompletion={user ? (habitId, date, completed) => toggleHabitCompletion(habitId, date, completed) : undefined}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard 
              habits={habits} 
              streakData={streakData}
              deletedHabits={deletedHabits}
              onRestoreHabit={restoreHabit}
              onPermanentlyDeleteHabit={permanentlyDeleteHabit}
              onDeleteAllHabits={deleteAllHabits}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
