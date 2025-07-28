import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Trophy, Target, Flame } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface StreakData {
  habitId: string;
  date: string;
  completed: boolean;
}

const HabitCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHabits, setSelectedHabits] = useState<Habit[]>([
    { id: '1', name: 'Gym Workout', color: 'bg-primary', icon: '💪' },
    { id: '2', name: 'Read 30min', color: 'bg-accent', icon: '📚' },
    { id: '3', name: 'Meditation', color: 'bg-success', icon: '🧘' },
  ]);

  const [streakData, setStreakData] = useState<StreakData[]>([
    { habitId: '1', date: '2024-01-20', completed: true },
    { habitId: '1', date: '2024-01-21', completed: true },
    { habitId: '2', date: '2024-01-20', completed: true },
    { habitId: '3', date: '2024-01-21', completed: false },
  ]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getHabitStatusForDate = (habitId: string, date: string) => {
    const entry = streakData.find(d => d.habitId === habitId && d.date === date);
    return entry?.completed;
  };

  const toggleHabitStatus = (habitId: string, date: string) => {
    setStreakData(prev => {
      const existing = prev.find(d => d.habitId === habitId && d.date === date);
      if (existing) {
        return prev.map(d => 
          d.habitId === habitId && d.date === date 
            ? { ...d, completed: !d.completed }
            : d
        );
      } else {
        return [...prev, { habitId, date, completed: true }];
      }
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-border/30"></div>);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date);
      const isToday = dateString === formatDate(new Date());

      days.push(
        <div
          key={day}
          className={`h-20 border border-border/30 p-1 hover:bg-muted/50 transition-colors ${
            isToday ? 'bg-gradient-subtle ring-2 ring-primary/20' : 'bg-card'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="flex flex-wrap gap-0.5">
            {selectedHabits.map(habit => {
              const status = getHabitStatusForDate(habit.id, dateString);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabitStatus(habit.id, dateString)}
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center transition-all hover:scale-110 ${
                    status === true
                      ? 'bg-gradient-success text-success-foreground shadow-sm'
                      : status === false
                      ? 'bg-destructive/20 text-destructive border border-destructive/40'
                      : 'bg-muted border border-border hover:bg-muted-foreground/20'
                  }`}
                  title={`${habit.name} - ${status === true ? 'Completed' : status === false ? 'Missed' : 'Not tracked'}`}
                >
                  {status === true ? '✓' : status === false ? '✗' : '•'}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center">
            <Calendar className="w-5 h-5 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Goal Rhythm</h1>
            <p className="text-muted-foreground">Track your journey, celebrate your progress</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{monthYear}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Habits Legend */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedHabits.map(habit => (
              <Badge key={habit.id} variant="secondary" className="text-sm">
                <span className="mr-1">{habit.icon}</span>
                {habit.name}
              </Badge>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-10 bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitCalendar;