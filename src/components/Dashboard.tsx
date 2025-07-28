import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Target, TrendingUp, Calendar, Award, Plus } from 'lucide-react';

interface DashboardProps {
  habits: Array<{id: string; name: string; icon: string}>;
  streakData: Array<{habitId: string; date: string; completed: boolean}>;
}

const Dashboard = ({ habits = [], streakData = [] }: DashboardProps) => {
  // Calculate current streaks for each habit
  const calculateCurrentStreak = (habitId: string) => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) { // Check last 365 days
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const entry = streakData.find(d => d.habitId === habitId && d.date === dateString);
      if (entry?.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreaks = habits.map(habit => ({
    name: habit.name,
    current: calculateCurrentStreak(habit.id),
    best: Math.max(calculateCurrentStreak(habit.id), 0), // For now, same as current
    icon: habit.icon,
    color: 'bg-primary'
  }));

  const achievements = [
    { 
      name: 'First Step', 
      description: 'Track your first habit', 
      icon: '🎯', 
      unlocked: habits.length > 0 
    },
    { 
      name: 'Week Warrior', 
      description: 'Complete any habit for 7 days straight', 
      icon: '🏆', 
      unlocked: currentStreaks.some(s => s.current >= 7) 
    },
    { 
      name: 'Consistency King', 
      description: 'Maintain 3 habits for 2 weeks', 
      icon: '👑', 
      unlocked: currentStreaks.filter(s => s.current >= 14).length >= 3 
    },
    { 
      name: 'Month Master', 
      description: 'Complete any habit for 30 days', 
      icon: '🎖️', 
      unlocked: currentStreaks.some(s => s.current >= 30) 
    },
  ];

  // Calculate this week's progress
  const getThisWeeksProgress = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    return Array.from({length: 7}, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const completed = habits.filter(habit => 
        streakData.some(d => d.habitId === habit.id && d.date === dateString && d.completed)
      ).length;
      
      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        completed,
        total: habits.length
      };
    });
  };

  const weeklyProgress = getThisWeeksProgress();

  const getStreakColor = (current: number) => {
    if (current >= 30) return 'text-primary';
    if (current >= 14) return 'text-success';
    if (current >= 7) return 'text-warning';
    return 'text-muted-foreground';
  };

  // Calculate today's progress
  const today = new Date().toISOString().split('T')[0];
  const totalHabitsToday = habits.length;
  const completedToday = habits.filter(habit => 
    streakData.some(d => d.habitId === habit.id && d.date === today && d.completed)
  ).length;
  const todayProgress = totalHabitsToday > 0 ? (completedToday / totalHabitsToday) * 100 : 0;

  // Show empty state if no habits
  if (habits.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-success/20 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Start Your Journey</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first habit to begin tracking your progress and building positive streaks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-foreground/80 text-sm font-medium">Today's Progress</p>
                <p className="text-2xl font-bold text-success-foreground">{completedToday}/{totalHabitsToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success-foreground/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-success-foreground" />
              </div>
            </div>
            <Progress value={todayProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-motivation">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-foreground/80 text-sm font-medium">Active Streaks</p>
                <p className="text-2xl font-bold text-warning-foreground">{currentStreaks.filter(s => s.current > 0).length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning-foreground/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-achievement">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-foreground/80 text-sm font-medium">Achievements</p>
                <p className="text-2xl font-bold text-accent-foreground">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent-foreground/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-foreground">
                  {weeklyProgress.reduce((acc, day) => acc + day.completed, 0)}/
                  {weeklyProgress.reduce((acc, day) => acc + day.total, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStreaks.map((streak, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{streak.icon}</div>
                  <div>
                    <h4 className="font-semibold text-foreground">{streak.name}</h4>
                    <p className="text-sm text-muted-foreground">Best: {streak.best} days</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getStreakColor(streak.current)}`}>
                    {streak.current}
                  </div>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
                  <div className={`w-full h-8 rounded-md flex items-center justify-center text-sm font-medium ${
                    day.completed === day.total 
                      ? 'bg-gradient-success text-success-foreground' 
                      : day.completed > 0 
                      ? 'bg-gradient-motivation text-warning-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {day.completed}/{day.total}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-achievement border-accent shadow-sm'
                    : 'bg-muted/50 border-border opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      achievement.unlocked ? 'text-accent-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-accent-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="bg-accent-foreground/20 text-accent-foreground">
                      Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;