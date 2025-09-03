import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Clock, ExternalLink, MapPin, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import TaskDialog from './TaskDialog';

interface TaskSectionProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskSection = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TaskSectionProps) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => task.date === today);
  const upcomingTasks = tasks.filter(task => task.date > today).slice(0, 5);

  const formatTime = (time?: string) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => 
          onUpdateTask(task.id, { completed: checked === true })
        }
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.name}
          </span>
          {task.link && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => window.open(task.link, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {task.isAllDay ? (
            <Badge variant="outline" className="text-xs">All day</Badge>
          ) : task.time && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(task.time)}
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{task.location}</span>
            </div>
          )}
        </div>
        
        {task.details && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.details}
          </p>
        )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="justify-start text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Tasks
            </CardTitle>
            <TaskDialog onAddTask={onAddTask} />
          </div>
        </CardHeader>
        <CardContent>
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tasks for today</p>
              <p className="text-sm">Add a task to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-center min-w-[3rem]">
                    <div className="text-sm font-medium">{formatDate(task.date)}</div>
                    {!task.isAllDay && task.time && (
                      <div className="text-xs text-muted-foreground">{formatTime(task.time)}</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{task.name}</span>
                      {task.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(task.link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    {task.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{task.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTask(task.id)}
                          className="justify-start text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskSection;