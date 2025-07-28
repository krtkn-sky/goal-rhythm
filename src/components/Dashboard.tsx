import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Target, TrendingUp, Calendar, Award } from 'lucide-react';

const Dashboard = () => {
  const currentStreaks = [
    { name: 'Gym Workout', current: 12, best: 45, icon: '💪', color: 'bg-primary' },
    { name: 'Read 30min', current: 8, best: 23, icon: '📚', color: 'bg-accent' },
    { name: 'Meditation', current: 3, best: 15, icon: '🧘', color: 'bg-success' },
  ];

  const achievements = [
    { name: 'Week Warrior', description: 'Complete any habit for 7 days straight', icon: '🏆', unlocked: true },
    { name: 'Consistency King', description: 'Maintain 3 habits for 2 weeks', icon: '👑', unlocked: true },
    { name: 'Month Master', description: 'Complete any habit for 30 days', icon: '🎯', unlocked: false },
    { name: 'Triple Threat', description: 'Maintain all habits for 1 week', icon: '⚡', unlocked: false },
  ];

  const weeklyProgress = [
    { day: 'Mon', completed: 3, total: 3 },
    { day: 'Tue', completed: 2, total: 3 },
    { day: 'Wed', completed: 3, total: 3 },
    { day: 'Thu', completed: 1, total: 3 },
    { day: 'Fri', completed: 3, total: 3 },
    { day: 'Sat', completed: 2, total: 3 },
    { day: 'Sun', completed: 0, total: 3 },
  ];

  const getStreakColor = (current: number) => {
    if (current >= 30) return 'text-primary';
    if (current >= 14) return 'text-success';
    if (current >= 7) return 'text-warning';
    return 'text-muted-foreground';
  };

  const totalHabitsToday = 3;
  const completedToday = 2;
  const todayProgress = (completedToday / totalHabitsToday) * 100;

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
                <p className="text-2xl font-bold text-warning-foreground">{currentStreaks.length}</p>
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