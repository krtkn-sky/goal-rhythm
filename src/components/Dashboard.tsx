
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Target, TrendingUp, Award, Flame, CheckCircle2, Eye, EyeOff } from 'lucide-react';

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

interface DashboardProps {
  habits?: Habit[];
  streakData?: StreakData[];
}

const Dashboard = ({ habits = [], streakData = [] }: DashboardProps) => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  
  // Get habits that should be active today
  const habitsForToday = habits.filter(habit => {
    if (habit.frequency === 'weekly' && habit.weeklyDays) {
      return habit.weeklyDays.includes(dayOfWeek);
    }
    return habit.frequency === 'daily';
  });

  // Calculate today's completion - only count explicitly completed habits
  const completedToday = habitsForToday.filter(habit => {
    const todayEntry = streakData.find(d => d.habitId === habit.id && d.date === todayString);
    return todayEntry?.completed === true; // Only count explicitly true completions
  }).length;

  const todayProgress = habitsForToday.length > 0 ? (completedToday / habitsForToday.length) * 100 : 0;

  // Calculate current streaks for each habit using the same logic as calendar
  const calculateCurrentStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // Start from today and work backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateString = checkDate.toISOString().split('T')[0];
      const checkDayOfWeek = checkDate.getDay();
      
      // Skip if this habit shouldn't be done on this day
      if (habit.frequency === 'weekly' && habit.weeklyDays) {
        if (!habit.weeklyDays.includes(checkDayOfWeek)) {
          continue; // Skip days when habit isn't scheduled
        }
      }
      
      // Check if completed on this day using the same logic as calendar
      const completionEntry = streakData.find(d => d.habitId === habitId && d.date === checkDateString);
      const wasCompleted = completionEntry?.completed === true;
      
      if (wasCompleted) {
        currentStreak++;
      } else {
        // Break streak if not completed on a day when it should have been done
        break;
      }
    }

    return currentStreak;
  };

  // Calculate longest streaks for each habit
  const calculateLongestStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitEntries = streakData
      .filter(d => d.habitId === habitId && d.completed === true)
      .map(d => new Date(d.date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (habitEntries.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < habitEntries.length; i++) {
      const prevDate = habitEntries[i - 1];
      const currentDate = habitEntries[i];
      
      // For weekly habits, we need to consider the frequency
      if (habit.frequency === 'weekly' && habit.weeklyDays) {
        // Check if these are consecutive scheduled days
        let daysBetween = 0;
        const tempDate = new Date(prevDate);
        tempDate.setDate(tempDate.getDate() + 1);
        
        while (tempDate < currentDate) {
          if (habit.weeklyDays.includes(tempDate.getDay())) {
            daysBetween++;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
        
        if (daysBetween === 0) {
          // Consecutive scheduled days
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          // Gap in scheduled days
          currentStreak = 1;
        }
      } else {
        // Daily habit - check for consecutive days
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return longestStreak;
  };

  const habitStats = habits.map(habit => ({
    ...habit,
    currentStreak: calculateCurrentStreak(habit.id),
    longestStreak: calculateLongestStreak(habit.id),
    totalCompletions: streakData.filter(d => d.habitId === habit.id && d.completed).length
  }));

  const bestStreak = Math.max(0, ...habitStats.map(h => h.longestStreak));
  const bestStreakHabit = habitStats.find(h => h.longestStreak === bestStreak);
  const totalHabitsCompleted = streakData.filter(d => d.completed).length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-success-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and celebrate your wins</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {completedToday}/{habitsForToday.length}
            </div>
            <Progress value={todayProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(todayProgress)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Streak</CardTitle>
            <div className="flex items-center gap-2">
              {bestStreakHabit && bestStreak > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bestStreakHabit.icon}</span>
                      <div>
                        <p className="font-medium">{bestStreakHabit.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bestStreakHabit.frequency === 'weekly' ? 
                            `${bestStreakHabit.weeklyDays?.length || 0} days/week` : 
                            'Daily'
                          }
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{bestStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bestStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{habits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalHabitsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Streaks */}
      {habitStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitStats
                .filter(habit => habit.currentStreak > 0)
                .sort((a, b) => b.currentStreak - a.currentStreak)
                .map(habit => (
                <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{habit.icon}</span>
                    <div>
                      <div className="font-medium text-foreground">{habit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {habit.frequency === 'weekly' ? 
                          `${habit.weeklyDays?.length || 0} days/week` : 
                          'Daily'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">
                      {habit.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {habit.currentStreak === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>
              ))}
              {habitStats.filter(habit => habit.currentStreak > 0).length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active streaks yet</p>
                  <p className="text-sm">Complete some habits to start building streaks!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
