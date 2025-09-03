import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Link, MapPin, Plus } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface TaskDialogProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  trigger?: React.ReactNode;
}

const TaskDialog = ({ onAddTask, trigger }: TaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    isAllDay: false,
    link: '',
    location: '',
    details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddTask({
      name: formData.name,
      date: formData.date,
      time: formData.isAllDay ? undefined : formData.time,
      isAllDay: formData.isAllDay,
      link: formData.link || undefined,
      location: formData.location || undefined,
      details: formData.details || undefined,
      completed: false
    });

    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      isAllDay: false,
      link: '',
      location: '',
      details: ''
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name *</Label>
            <Input
              id="task-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="task-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="task-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="pl-10"
                  disabled={formData.isAllDay}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="all-day"
              checked={formData.isAllDay}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                isAllDay: checked,
                time: checked ? '' : prev.time
              }))}
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-link">Link</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="task-link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="task-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Meeting room, address, etc."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-details">Other Details</Label>
            <Textarea
              id="task-details"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Additional notes or details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;