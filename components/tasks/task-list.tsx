'use client';

import { useTasks } from '@/lib/hooks/use-tasks';
import { TaskItem } from './task-item';

export function TaskList() {
  const { data: tasks, isLoading, isError } = useTasks();
  
  if (isLoading) {
    return <div className="text-center py-4">Загрузка задач...</div>;
  }
  
  if (isError) {
    return (
      <div className="text-center py-4 text-red-500">
        Ошибка при загрузке задач. Пожалуйста, попробуйте позже.
      </div>
    );
  }
  
  if (!tasks?.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        У вас пока нет задач. Создайте первую!
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
} 