'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, useDeleteTask, useUpdateTask } from '@/lib/hooks/use-tasks';
import { Input } from '@/components/ui/input';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const handleToggleComplete = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { completed: !task.completed },
      });
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!title.trim()) return;
    
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title,
          description: description || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
    }
  };
  
  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };
  
  return (
    <Card className={task.completed ? 'opacity-70' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggleComplete}
            className="h-4 w-4"
          />
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold"
            />
          ) : (
            <span className={task.completed ? 'line-through' : ''}>
              {task.title}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
          />
        ) : (
          <p className="text-sm text-gray-500">{task.description || 'Нет описания'}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={!title.trim()}>
                Сохранить
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Редактировать
            </Button>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Удалить
        </Button>
      </CardFooter>
    </Card>
  );
} 