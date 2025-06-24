'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTask } from '@/lib/hooks/use-tasks';

export function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const createTask = useCreateTask();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    try {
      await createTask.mutateAsync({
        title,
        description: description || undefined,
      });
      
      // Сбросить форму
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Название задачи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          placeholder="Описание (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button 
        type="submit" 
        disabled={createTask.isPending || !title.trim()}
      >
        {createTask.isPending ? 'Добавление...' : 'Добавить задачу'}
      </Button>
    </form>
  );
} 