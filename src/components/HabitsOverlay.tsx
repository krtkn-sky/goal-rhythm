import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Calendar, Target, Award, Flame, TrendingUp } from 'lucide-react';

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

interface HabitsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  streakData: StreakData[];
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
}

const HabitsOverlay = ({ 
  isOpen, 
  onClose, 
  habits, 
  streakData, 
  onEditHabit, 
  onDeleteHabit 
}: HabitsOverlayProps) => {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Calculate stats for each habit
  const calculateHabitStats = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0 };

    // Current streak calculation
    let currentStreak = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateString = checkDate.toISOString().split('T')[0];
      const checkDayOfWeek = checkDate.getDay();
      
      if (habit.frequency === 'weekly' && habit.weeklyDays) {
        if (!habit.weeklyDays.includes(checkDayOfWeek)) {
          continue;
        }
      }
      
      const completionEntry = streakData.find(d => d.habitId === habitId && d.date === checkDateString);
      const wasCompleted = completionEntry?.completed === true;
      
      if (wasCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak calculation
    const habitEntries = streakData
      .filter(d => d.habitId === habitId && d.completed === true)
      .map(d => new Date(d.date))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    if (habitEntries.length > 0) {
      longestStreak = 1;
      let currentLongestStreak = 1;

      for (let i = 1; i < habitEntries.length; i++) {
        const prevDate = habitEntries[i - 1];
        const currentDate = habitEntries[i];
        
        if (habit.frequency === 'weekly' && habit.weeklyDays) {
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
            currentLongestStreak++;
            longestStreak = Math.max(longestStreak, currentLongestStreak);
          } else {
            currentLongestStreak = 1;
          }
        } else {
          const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            currentLongestStreak++;
            longestStreak = Math.max(longestStreak, currentLongestStreak);
          } else {
            currentLongestStreak = 1;
          }
        }
      }
    }

    // Total completions
    const totalCompletions = streakData.filter(d => d.habitId === habitId && d.completed).length;

    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let eligibleDays = 0;
    let completedInPeriod = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateString = checkDate.toISOString().split('T')[0];
      const checkDayOfWeek = checkDate.getDay();
      
      // Check if this day is eligible for the habit
      let isEligible = false;
      if (habit.frequency === 'weekly' && habit.weeklyDays) {
        isEligible = habit.weeklyDays.includes(checkDayOfWeek);
      } else {
        isEligible = habit.frequency === 'daily';
      }
      
      if (isEligible) {
        eligibleDays++;
        const completion = streakData.find(d => d.habitId === habitId && d.date === checkDateString);
        if (completion?.completed) {
          completedInPeriod++;
        }
      }
    }
    
    const completionRate = eligibleDays > 0 ? (completedInPeriod / eligibleDays) * 100 : 0;

    return { currentStreak, longestStreak, totalCompletions, completionRate };
  };

  const habitStats = habits.map(habit => ({
    ...habit,
    ...calculateHabitStats(habit.id)
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Habits
          </DialogTitle>
        </DialogHeader>
        
        {selectedHabit ? (
          // Habit details view
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedHabit.icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{selectedHabit.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedHabit.frequency === 'weekly' 
                      ? `${selectedHabit.weeklyDays?.length || 0} days/week` 
                      : 'Daily'
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedHabit(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {(() => {
              const stats = calculateHabitStats(selectedHabit.id);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Current Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.currentStreak}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.currentStreak === 1 ? 'day' : 'days'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        Best Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.longestStreak}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.longestStreak === 1 ? 'day' : 'days'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(stats.completionRate)}%</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                      <Progress value={stats.completionRate} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Total Days
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCompletions}</div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            <div className="flex gap-2">
              {onEditHabit && (
                <Button onClick={() => onEditHabit(selectedHabit)}>
                  Edit Habit
                </Button>
              )}
              {onDeleteHabit && (
                <Button 
                  variant="destructive" 
                  onClick={() => onDeleteHabit(selectedHabit.id)}
                >
                  Delete Habit
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Habits grid view
          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No habits yet</p>
                <p className="text-sm text-muted-foreground">Add your first habit to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habitStats.map(habit => (
                  <Card 
                    key={habit.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedHabit(habit)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{habit.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium">{habit.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {habit.frequency === 'weekly' 
                              ? `${habit.weeklyDays?.length || 0} days/week` 
                              : 'Daily'
                            }
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-bold">{habit.currentStreak} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Best</p>
                          <p className="font-bold">{habit.longestStreak} days</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">Completion Rate</span>
                          <span className="text-xs font-medium">{Math.round(habit.completionRate)}%</span>
                        </div>
                        <Progress value={habit.completionRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HabitsOverlay;