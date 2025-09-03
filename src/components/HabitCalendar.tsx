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
import { ChevronLeft, ChevronRight, Calendar, Target, Plus, X, ChevronDown, Check, Minus, List, Eye } from 'lucide-react';
import HabitsOverlay from './HabitsOverlay';

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
  onAddHabit?: (habit: Omit<Habit, 'id'>) => void;
  onDeleteHabit?: (habitId: string) => void;
  onToggleCompletion?: (habitId: string, date: string, completed?: boolean) => void;
}

const HabitCalendar = ({ 
  habits: externalHabits = [], 
  streakData: externalStreakData = [], 
  deletedHabits: externalDeletedHabits = [],
  onHabitsChange, 
  onStreakDataChange, 
  onDeletedHabitsChange,
  onAddHabit,
  onDeleteHabit,
  onToggleCompletion
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
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitIcon, setEditHabitIcon] = useState('');
  const [editHabitFrequency, setEditHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [editHabitWeeklyDays, setEditHabitWeeklyDays] = useState<number[]>([]);
  const [isHabitsOverlayOpen, setIsHabitsOverlayOpen] = useState(false);

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
      // Check for duplicate names
      const existingHabit = selectedHabits.find(h => h.name.toLowerCase() === newHabitName.trim().toLowerCase());
      if (existingHabit) {
        alert("Habit with the same name exists, try using a different emoji");
        return;
      }
      
      const newHabit = {
        name: newHabitName.trim(),
        color: habitColors[selectedHabits.length % habitColors.length],
        icon: newHabitIcon,
        createdAt: new Date().toISOString(),
        frequency: newHabitFrequency,
        weeklyDays: newHabitFrequency === 'weekly' ? newHabitWeeklyDays : undefined
      };
      
      if (onAddHabit) {
        onAddHabit(newHabit);
      } else {
        // Fallback to old method if no onAddHabit provided
        const habitWithId = { ...newHabit, id: Date.now().toString() };
        const updatedHabits = [...selectedHabits, habitWithId];
        onHabitsChange?.(updatedHabits);
      }
      
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
    if (onDeleteHabit) {
      onDeleteHabit(habitId);
    } else {
      // Fallback to old method if no onDeleteHabit provided
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
    }
    setHabitToDelete(null);
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabitName(habit.name);
    setEditHabitIcon(habit.icon);
    setEditHabitFrequency(habit.frequency || 'daily');
    setEditHabitWeeklyDays(habit.weeklyDays || []);
  };

  const saveEditHabit = () => {
    if (editHabitName.trim() && (editHabitFrequency === 'daily' || editHabitWeeklyDays.length > 0) && editingHabit) {
      const updatedHabit = {
        ...editingHabit,
        name: editHabitName.trim(),
        icon: editHabitIcon,
        frequency: editHabitFrequency,
        weeklyDays: editHabitFrequency === 'weekly' ? editHabitWeeklyDays : undefined
      };
      const updatedHabits = selectedHabits.map(h => h.id === editingHabit.id ? updatedHabit : h);
      onHabitsChange?.(updatedHabits);
      setEditingHabit(null);
    }
  };

  const toggleEditWeeklyDay = (dayIndex: number) => {
    setEditHabitWeeklyDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const toggleHabitStatus = (habitId: string, date: string, completed: boolean) => {
    // Prevent marking future dates
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      return; // Don't allow future dates
    }

    if (onToggleCompletion) {
      onToggleCompletion(habitId, date, completed);
    } else {
      // Fallback to old method if no onToggleCompletion provided
      const updatedStreakData = streakData.filter(d => !(d.habitId === habitId && d.date === date));
      if (completed !== undefined) {
        updatedStreakData.push({ habitId, date, completed });
      }
      onStreakDataChange?.(updatedStreakData);
    }
  };

  const getDayCompletionStatus = (dateString: string) => {
    if (selectedHabits.length === 0) return 'none';
    
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    // Get habits that should be tracked for this specific day
    const habitsForThisDay = selectedHabits.filter(habit => {
      if (habit.frequency === 'weekly' && habit.weeklyDays) {
        return habit.weeklyDays.includes(dayOfWeek);
      }
      return habit.frequency === 'daily';
    });
    
    if (habitsForThisDay.length === 0) return 'none';
    
    // Check completion status for each habit on this day
    const completedCount = habitsForThisDay.filter(habit => {
      const status = getHabitStatusForDate(habit.id, dateString);
      return status === true; // Only count explicitly completed habits
    }).length;
    
    const incompletedCount = habitsForThisDay.filter(habit => {
      const status = getHabitStatusForDate(habit.id, dateString);
      return status === false; // Only count explicitly missed habits
    }).length;
    
    const untouchedCount = habitsForThisDay.filter(habit => {
      const status = getHabitStatusForDate(habit.id, dateString);
      return status === undefined; // Count habits that haven't been interacted with
    }).length;
    
    // All habits are explicitly completed
    if (completedCount === habitsForThisDay.length) {
      return 'complete';
    }
    
    // Some habits completed, but others are incomplete or untouched
    if (completedCount > 0 && (incompletedCount > 0 || untouchedCount > 0)) {
      return 'partial';
    }
    
    // Some habits explicitly missed, none completed
    if (incompletedCount > 0 && completedCount === 0) {
      return 'missed';
    }
    
    // No interaction yet
    return 'none';
  };

  const renderDayIndicator = (status: string) => {
    const baseStyle = "absolute inset-0 flex items-center justify-center pointer-events-none";
    
    switch (status) {
      case 'complete':
        return (
          <div className={`${baseStyle} text-green-600`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor">
              <path d="M4 12l4 4 12-12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'partial':
        return (
          <div className={`${baseStyle} text-yellow-500`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
          </div>
        );
      case 'missed':
        return (
          <div className={`${baseStyle} text-red-500`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
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

  const renderMiniCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const todayString = formatDate(today);

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 border border-border/20"></div>);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date);
      const todayDate = new Date();
      const isToday = date.getDate() === todayDate.getDate() && 
                      date.getMonth() === todayDate.getMonth() && 
                      date.getFullYear() === todayDate.getFullYear();

      days.push(
        <div
          key={day}
          className={`h-8 border flex items-center justify-center text-xs transition-colors ${
            isToday 
              ? 'bg-primary/10 text-primary border-primary border-2 font-bold' 
              : 'border-border/20 bg-card text-muted-foreground hover:bg-muted/50'
          }`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-16 md:h-20 border border-border/30"></div>);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date);
      const todayDate = new Date();
      const isToday = date.getDate() === todayDate.getDate() && 
                      date.getMonth() === todayDate.getMonth() && 
                      date.getFullYear() === todayDate.getFullYear();
      const isFuture = date > today;
      const dayStatus = getDayCompletionStatus(dateString);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      days.push(
        <div
          key={day}
          className={`h-12 sm:h-16 md:h-20 border border-border/30 p-1 transition-colors relative ${
            isFuture 
              ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
              : 'hover:bg-muted/50 cursor-pointer'
          } ${
            isToday ? 'bg-primary/20 border-primary border-2' : 'bg-card'
          }`}
        >
          <div className={`text-xs sm:text-sm font-medium mb-1 ${
            isFuture ? 'text-muted-foreground' : isToday ? 'text-primary font-bold' : 'text-foreground'
          }`}>
            {day}
          </div>
          
          {/* Day completion indicator */}
          {!isFuture && dayStatus !== 'none' && renderDayIndicator(dayStatus)}
          
          {/* Unified Dropdown for all habits - only show if there are habits for this day */}
          {(() => {
            const habitsForThisDay = selectedHabits.filter(habit => {
              // For weekly habits, only show on designated days
              if (habit.frequency === 'weekly' && habit.weeklyDays) {
                return habit.weeklyDays.includes(dayOfWeek);
              }
              // For daily habits, show every day
              return habit.frequency === 'daily';
            });
            
            return habitsForThisDay.length > 0 && !isFuture && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 w-4 h-4 sm:w-6 sm:h-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <List className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg z-50">
                  {habitsForThisDay.map(habit => {
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
                              onClick={() => toggleHabitStatus(habit.id, dateString, undefined)}
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
            );
          })()}
          
        </div>
      );
    }

    return days;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Always show calendar - if no habits, show the same calendar but with Add Habit button

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-success flex items-center justify-center">
            <Calendar className="w-5 h-5 text-success-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Habit Calendar</h1>
            <p className="text-muted-foreground">
              {selectedHabits.length === 0 
                ? "Add your first habit to start tracking your journey" 
                : "Track your journey, celebrate your progress"
              }
            </p>
          </div>
        </div>
        
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

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-xl">{monthYear}</CardTitle>
              <div className="flex items-center gap-2">
                {/* Habits Button - moved to left below month name */}
                {selectedHabits.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsHabitsOverlayOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Habits ({selectedHabits.length})
                  </Button>
                )}
                
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {selectedHabits.length === 0 ? "Add Your First Habit" : "Add Habit"}
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
        </CardHeader>
        
        <CardContent>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-10 bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {selectedHabits.length > 0 ? renderCalendarDays() : (() => {
              const daysInMonth = getDaysInMonth(currentDate);
              const firstDay = getFirstDayOfMonth(currentDate);
              const days = [];
              const today = new Date();
              const todayString = formatDate(today);

              // Empty cells for previous month
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="h-20 border border-border/30"></div>);
              }

              // Calendar days - simplified for no habits
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const todayDate = new Date();
                const isToday = date.getDate() === todayDate.getDate() && 
                                date.getMonth() === todayDate.getMonth() && 
                                date.getFullYear() === todayDate.getFullYear();

                days.push(
                  <div
                    key={day}
                    className={`h-20 border p-1 transition-colors ${
                      isToday ? 'bg-primary/20 border-primary border-2' : 'border-border/30 bg-card'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isToday ? 'text-primary font-bold' : 'text-foreground'
                    }`}>
                      {day}
                    </div>
                    {selectedHabits.length === 0 && isToday && (
                      <div className="mt-2 text-xs text-muted-foreground text-center">
                        Today
                      </div>
                    )}
                  </div>
                );
              }

              return days;
            })()}
          </div>
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

      {/* Edit Habit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-habit-name">Habit Name</Label>
              <Input
                id="edit-habit-name"
                value={editHabitName}
                onChange={(e) => setEditHabitName(e.target.value)}
                placeholder="e.g., Morning Exercise"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Frequency</Label>
              <Select value={editHabitFrequency} onValueChange={(value: 'daily' | 'weekly') => setEditHabitFrequency(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekly">Specific days of the week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editHabitFrequency === 'weekly' && (
              <div>
                <Label>Select Days</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <Checkbox
                        id={`edit-day-${index}`}
                        checked={editHabitWeeklyDays.includes(index)}
                        onCheckedChange={() => toggleEditWeeklyDay(index)}
                      />
                      <Label htmlFor={`edit-day-${index}`} className="text-xs">{day}</Label>
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
                    onClick={() => setEditHabitIcon(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                      editHabitIcon === icon 
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
                onClick={saveEditHabit} 
                className="flex-1"
                disabled={!editHabitName.trim() || (editHabitFrequency === 'weekly' && editHabitWeeklyDays.length === 0)}
              >
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingHabit(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Habits Overlay */}
      <HabitsOverlay
        isOpen={isHabitsOverlayOpen}
        onClose={() => setIsHabitsOverlayOpen(false)}
        habits={selectedHabits}
        streakData={streakData}
        onEditHabit={(habit) => {
          setIsHabitsOverlayOpen(false);
          openEditHabit(habit);
        }}
        onDeleteHabit={(habitId) => {
          setIsHabitsOverlayOpen(false);
          setHabitToDelete(habitId);
        }}
      />
    </div>
  );
};

export default HabitCalendar;
