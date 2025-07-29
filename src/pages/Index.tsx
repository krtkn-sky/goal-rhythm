import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HabitCalendar from '@/components/HabitCalendar';
import Dashboard from '@/components/Dashboard';
import { Calendar, BarChart3, User, Sparkles, Moon, Sun } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [deletedHabits, setDeletedHabits] = useState<DeletedHabit[]>([]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  const restoreHabit = (deletedHabit: DeletedHabit) => {
    // Remove from deleted habits
    const updatedDeletedHabits = deletedHabits.filter(h => 
      !(h.id === deletedHabit.id && h.deletedAt === deletedHabit.deletedAt)
    );
    setDeletedHabits(updatedDeletedHabits);

    // Add back to active habits with new ID to avoid conflicts
    const restoredHabit: Habit = {
      id: Date.now().toString(), // New ID
      name: deletedHabit.name,
      color: deletedHabit.color,
      icon: deletedHabit.icon,
      createdAt: new Date().toISOString(), // New start date
      frequency: deletedHabit.frequency,
      weeklyDays: deletedHabit.weeklyDays
    };
    
    const updatedHabits = [...habits, restoredHabit];
    setHabits(updatedHabits);
  };

  const editHabit = (habitId: string, updatedHabit: Habit) => {
    const updatedHabits = habits.map(habit => 
      habit.id === habitId ? updatedHabit : habit
    );
    setHabits(updatedHabits);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

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
              <h1 className="text-xl font-bold text-foreground">Goal Rhythm</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleDarkMode}
                className="w-9 h-9 p-0"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Sign In
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
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard 
              habits={habits} 
              streakData={streakData} 
              deletedHabits={deletedHabits}
              onRestoreHabit={restoreHabit}
              onEditHabit={editHabit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
