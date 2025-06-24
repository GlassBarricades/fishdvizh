'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Типы данных
export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

// Ключи запросов
const TASKS_QUERY_KEY = 'tasks';

// Функция получения всех задач
async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Ошибка при получении задач');
  }
  return response.json();
}

// Функция получения одной задачи
async function fetchTask(id: number): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`);
  if (!response.ok) {
    throw new Error('Ошибка при получении задачи');
  }
  return response.json();
}

// Функция создания задачи
async function createTask(data: CreateTaskInput): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при создании задачи');
  }
  
  return response.json();
}

// Функция обновления задачи
async function updateTask(id: number, data: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при обновлении задачи');
  }
  
  return response.json();
}

// Функция удаления задачи
async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при удалении задачи');
  }
}

// Хук для получения всех задач
export function useTasks() {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: fetchTasks,
  });
}

// Хук для получения одной задачи
export function useTask(id: number) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, id],
    queryFn: () => fetchTask(id),
  });
}

// Хук для создания задачи
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

// Хук для обновления задачи
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskInput }) => 
      updateTask(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, variables.id] });
    },
  });
}

// Хук для удаления задачи
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
} 