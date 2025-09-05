
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Target, TrendingUp, Award, Flame, CheckCircle2, Eye, Trash2, RotateCcw, Trophy, Medal, Zap, Star } from 'lucide-react';

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

interface DashboardProps {
  habits?: Habit[];
  streakData?: StreakData[];
  deletedHabits?: DeletedHabit[];
  lifetimeScore?: number;
  onRestoreHabit?: (habit: DeletedHabit) => void;
  onPermanentlyDeleteHabit?: (habitId: string) => void;
  onDeleteAllHabits?: () => void;
}

const Dashboard = ({ 
  habits = [], 
  streakData = [], 
  deletedHabits = [],
  lifetimeScore = 0,
  onRestoreHabit,
  onPermanentlyDeleteHabit,
  onDeleteAllHabits
}: DashboardProps) => {
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
  
  // Debug logging
  console.log('Dashboard Debug:', {
    todayString,
    habitsForToday: habitsForToday.map(h => ({ id: h.id, name: h.name })),
    streakDataToday: streakData.filter(d => d.date === todayString),
    completedToday,
    todayProgress
  });

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

  // Calculate achievements based on score
  const getAchievements = () => {
    const achievements = [];
    
    // Score milestones
    if (lifetimeScore >= 10) achievements.push({ icon: '🥉', title: 'Bronze Scorer', description: '10+ points earned!', unlocked: true });
    if (lifetimeScore >= 50) achievements.push({ icon: '🥈', title: 'Silver Scorer', description: '50+ points earned!', unlocked: true });
    if (lifetimeScore >= 100) achievements.push({ icon: '🥇', title: 'Gold Scorer', description: '100+ points earned!', unlocked: true });
    if (lifetimeScore >= 250) achievements.push({ icon: '💎', title: 'Diamond Scorer', description: '250+ points earned!', unlocked: true });
    
    // Streak achievements  
    if (bestStreak >= 7) achievements.push({ icon: '🔥', title: 'Week Warrior', description: `${bestStreak} day streak!`, unlocked: true });
    if (bestStreak >= 30) achievements.push({ icon: '🏆', title: 'Monthly Master', description: `${bestStreak} day streak!`, unlocked: true });
    
    // Habit variety
    if (habits.length >= 3) achievements.push({ icon: '🎯', title: 'Multitasker', description: '3+ active habits!', unlocked: true });
    if (habits.length >= 5) achievements.push({ icon: '🚀', title: 'Habit Master', description: '5+ active habits!', unlocked: true });
    
    // Add locked achievements for motivation
    if (lifetimeScore < 10) achievements.push({ icon: '🥉', title: 'Bronze Scorer', description: 'Earn 10 points', unlocked: false });
    if (lifetimeScore < 50) achievements.push({ icon: '🥈', title: 'Silver Scorer', description: 'Earn 50 points', unlocked: false });
    if (lifetimeScore < 100) achievements.push({ icon: '🥇', title: 'Gold Scorer', description: 'Earn 100 points', unlocked: false });
    if (bestStreak < 7) achievements.push({ icon: '🔥', title: 'Week Warrior', description: 'Get a 7-day streak', unlocked: false });
    
    return achievements.slice(0, 6); // Show max 6 achievements
  };

  // Calculate most missed habit
  const getMostMissedHabit = () => {
    if (habits.length === 0) return null;

    const habitMissStats = habits.map(habit => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      let scheduledDays = 0;
      let missedDays = 0;
      
      // Count scheduled and missed days in the last 30 days
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(thirtyDaysAgo);
        checkDate.setDate(thirtyDaysAgo.getDate() + i);
        const checkDateString = checkDate.toISOString().split('T')[0];
        const checkDayOfWeek = checkDate.getDay();
        
        // Skip if this habit shouldn't be done on this day
        if (habit.frequency === 'weekly' && habit.weeklyDays) {
          if (!habit.weeklyDays.includes(checkDayOfWeek)) {
            continue;
          }
        }
        
        scheduledDays++;
        
        // Check if missed (explicitly marked as false or not completed)
        const completionEntry = streakData.find(d => d.habitId === habit.id && d.date === checkDateString);
        if (!completionEntry || completionEntry.completed === false) {
          missedDays++;
        }
      }
      
      const missRate = scheduledDays > 0 ? Math.round((missedDays / scheduledDays) * 100) : 0;
      return { ...habit, missRate, missedDays, scheduledDays };
    });

    // Return habit with highest miss rate (minimum 3 missed days to be significant)
    const mostMissed = habitMissStats
      .filter(h => h.missedDays >= 3)
      .sort((a, b) => b.missRate - a.missRate)[0];
    
    return mostMissed || null;
  };

  const achievements = getAchievements();

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Missed Often</CardTitle>
            <div className="flex items-center gap-2">
              {getMostMissedHabit() && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMostMissedHabit()?.icon}</span>
                      <div>
                        <p className="font-medium">{getMostMissedHabit()?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getMostMissedHabit()?.missRate}% missed
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {getMostMissedHabit()?.missRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getMostMissedHabit()?.name || 'No habit'} miss rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{lifetimeScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total points earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800' 
                    : 'bg-muted/30 border-muted opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <Medal className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recycle Bin */}
      {deletedHabits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-muted-foreground" />
                Recycle Bin
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteAllHabits}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Empty Bin
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {deletedHabits.map(habit => (
                <div key={`${habit.id}-${habit.deletedAt}`} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-60">{habit.icon}</span>
                    <div>
                      <div className="font-medium text-muted-foreground">{habit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {habit.longestStreak} day streak • {habit.totalDays} total completions
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreHabit?.(habit)}
                      className="text-success hover:text-success"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPermanentlyDeleteHabit?.(habit.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
