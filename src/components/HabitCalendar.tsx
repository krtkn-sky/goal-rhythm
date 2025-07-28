import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Calendar, Target, Plus, X, ChevronDown, Check, Minus, List } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  frequency?: 'daily' | 'weekly';
  weeklyDays?: number[]; // 0-6 for Sunday-Saturday
}

interface StreakData {
  habitId: string;
  date: string;
  completed: boolean;
}

interface DeletedHabit extends Habit {
  deletedAt: string;
  longestStreak: number;
  totalDays: number;
}

interface HabitCalendarProps {
  habits?: Habit[];
  streakData?: StreakData[];
  deletedHabits?: DeletedHabit[];
  onHabitsChange?: (habits: Habit[]) => void;
  onStreakDataChange?: (data: StreakData[]) => void;
  onDeletedHabitsChange?: (deleted: DeletedHabit[]) => void;
}

const HabitCalendar = ({ 
  habits: externalHabits = [], 
  streakData: externalStreakData = [], 
  deletedHabits: externalDeletedHabits = [],
  onHabitsChange, 
  onStreakDataChange, 
  onDeletedHabitsChange 
}: HabitCalendarProps) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  // Use external state if provided, otherwise fall back to local state
  const selectedHabits = externalHabits;
  const streakData = externalStreakData;
  const deletedHabits = externalDeletedHabits;
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🎯');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [newHabitWeeklyDays, setNewHabitWeeklyDays] = useState<number[]>([]);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  const habitIcons = ['🎯', '💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎨'];
  const habitColors = ['bg-primary', 'bg-success', 'bg-accent', 'bg-warning'];

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

  const addNewHabit = () => {
    if (newHabitName.trim() && (newHabitFrequency === 'daily' || newHabitWeeklyDays.length > 0)) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        color: habitColors[selectedHabits.length % habitColors.length],
        icon: newHabitIcon,
        createdAt: new Date().toISOString(),
        frequency: newHabitFrequency,
        weeklyDays: newHabitFrequency === 'weekly' ? newHabitWeeklyDays : undefined
      };
      const updatedHabits = [...selectedHabits, newHabit];
      onHabitsChange?.(updatedHabits);
      setNewHabitName('');
      setNewHabitIcon('🎯');
      setNewHabitFrequency('daily');
      setNewHabitWeeklyDays([]);
      setIsAddHabitOpen(false);
    }
  };

  const toggleWeeklyDay = (dayIndex: number) => {
    setNewHabitWeeklyDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const calculateLongestStreak = (habitId: string): number => {
    const habitEntries = streakData
      .filter(d => d.habitId === habitId && d.completed)
      .map(d => new Date(d.date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (habitEntries.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < habitEntries.length; i++) {
      const prevDate = habitEntries[i - 1];
      const currentDate = habitEntries[i];
      const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  const deleteHabit = (habitId: string) => {
    const habitToDelete = selectedHabits.find(h => h.id === habitId);
    if (!habitToDelete) return;

    const longestStreak = calculateLongestStreak(habitId);
    const totalDays = streakData.filter(d => d.habitId === habitId && d.completed).length;

    const deletedHabit: DeletedHabit = {
      ...habitToDelete,
      deletedAt: new Date().toISOString(),
      longestStreak,
      totalDays
    };

    const updatedHabits = selectedHabits.filter(h => h.id !== habitId);
    const updatedStreakData = streakData.filter(d => d.habitId !== habitId);
    const updatedDeletedHabits = [...deletedHabits, deletedHabit];
    
    onHabitsChange?.(updatedHabits);
    onStreakDataChange?.(updatedStreakData);
    onDeletedHabitsChange?.(updatedDeletedHabits);
    setHabitToDelete(null);
  };

  const toggleHabitStatus = (habitId: string, date: string, completed: boolean) => {
    // Prevent marking future dates
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      return; // Don't allow future dates
    }

    const updatedStreakData = streakData.filter(d => !(d.habitId === habitId && d.date === date));
    updatedStreakData.push({ habitId, date, completed });
    
    onStreakDataChange?.(updatedStreakData);
  };

  const getDayCompletionStatus = (dateString: string) => {
    if (selectedHabits.length === 0) return 'none';
    
    const completedHabits = selectedHabits.filter(habit => 
      getHabitStatusForDate(habit.id, dateString) === true
    ).length;
    
    if (completedHabits === selectedHabits.length) return 'complete';
    if (completedHabits > 0) return 'partial';
    
    const hasAnyData = selectedHabits.some(habit => 
      getHabitStatusForDate(habit.id, dateString) !== undefined
    );
    
    return hasAnyData ? 'missed' : 'none';
  };

  const renderDayIndicator = (status: string) => {
    const baseStyle = "absolute top-1 left-1 w-4 h-4 flex items-center justify-center text-xs font-bold";
    
    switch (status) {
      case 'complete':
        return (
          <div className={`${baseStyle} text-green-600`}>
            <svg viewBox="0 0 16 16" className="w-full h-full" fill="currentColor">
              <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'partial':
        return (
          <div className={`${baseStyle} text-yellow-500`}>
            <svg viewBox="0 0 16 16" className="w-full h-full" fill="currentColor">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        );
      case 'missed':
        return (
          <div className={`${baseStyle} text-red-500`}>
            <svg viewBox="0 0 16 16" className="w-full h-full" fill="currentColor">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
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
      const today = new Date();
      const isToday = dateString === formatDate(today);
      const isFuture = date > today;
      const dayStatus = getDayCompletionStatus(dateString);

      days.push(
        <div
          key={day}
          className={`h-20 border border-border/30 p-1 transition-colors relative ${
            isFuture 
              ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
              : 'hover:bg-muted/50 cursor-pointer'
          } ${
            isToday ? 'bg-gradient-subtle ring-2 ring-primary/20' : 'bg-card'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isFuture ? 'text-muted-foreground' : isToday ? 'text-primary' : 'text-foreground'
          }`}>
            {day}
          </div>
          
          {/* Day completion indicator */}
          {!isFuture && dayStatus !== 'none' && renderDayIndicator(dayStatus)}
          {/* Unified Dropdown for all habits */}
          {selectedHabits.length > 0 && !isFuture && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 w-6 h-6 p-0 opacity-60 hover:opacity-100"
                >
                  <List className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg z-50">
                {selectedHabits.map(habit => {
                  const status = getHabitStatusForDate(habit.id, dateString);
                  return (
                    <div key={habit.id} className="p-2 border-b border-border/50 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{habit.icon}</span>
                        <span className="font-medium text-sm flex-1">{habit.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          status === true ? 'bg-success' : status === false ? 'bg-destructive' : 'bg-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={status === true ? "default" : "outline"}
                          onClick={() => toggleHabitStatus(habit.id, dateString, true)}
                          className="flex-1 h-7 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant={status === false ? "destructive" : "outline"}
                          onClick={() => toggleHabitStatus(habit.id, dateString, false)}
                          className="flex-1 h-7 text-xs"
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Miss
                        </Button>
                        {status !== undefined && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updatedData = streakData.filter(d => !(d.habitId === habit.id && d.date === dateString));
                              onStreakDataChange?.(updatedData);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
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
          <Dialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="habit-name">Habit Name</Label>
                  <Input
                    id="habit-name"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g., Morning Exercise"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Frequency</Label>
                  <Select value={newHabitFrequency} onValueChange={(value: 'daily' | 'weekly') => setNewHabitFrequency(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Every day</SelectItem>
                      <SelectItem value="weekly">Specific days of the week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newHabitFrequency === 'weekly' && (
                  <div>
                    <Label>Select Days</Label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <Checkbox
                            id={`day-${index}`}
                            checked={newHabitWeeklyDays.includes(index)}
                            onCheckedChange={() => toggleWeeklyDay(index)}
                          />
                          <Label htmlFor={`day-${index}`} className="text-xs">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Choose Icon</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {habitIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewHabitIcon(icon)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                          newHabitIcon === icon 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted-foreground/20'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={addNewHabit} 
                    className="flex-1"
                    disabled={!newHabitName.trim() || (newHabitFrequency === 'weekly' && newHabitWeeklyDays.length === 0)}
                  >
                    Add Habit
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddHabitOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
          {selectedHabits.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedHabits.map(habit => (
                <div key={habit.id} className="relative">
                  <Badge variant="secondary" className="text-sm pr-8">
                    <span className="mr-1">{habit.icon}</span>
                    {habit.name}
                  </Badge>
                  <button
                    onClick={() => setHabitToDelete(habit.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform"
                    title="Delete habit"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No habits yet!</p>
              <p className="text-sm">Click "Add Habit" to start tracking your goals</p>
            </div>
          )}

          {/* Calendar Grid */}
          {selectedHabits.length > 0 && (
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={habitToDelete !== null} onOpenChange={() => setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? It will be moved to the habit recycler where you can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => habitToDelete && deleteHabit(habitToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HabitCalendar;