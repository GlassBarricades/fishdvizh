'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EditEventForm } from '@/components/fishing/edit-event-form';

export default function EditEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Проверка авторизации
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/fishing/${id}/edit`);
    }
  }, [status, router, id]);
  
  // Загрузка данных события
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/fishing/events/${id}`);
        
        if (!response.ok) {
          throw new Error('Ошибка при получении данных о событии');
        }
        
        const data = await response.json();
        
        // Проверяем, принадлежит ли событие текущему пользователю
        if (data.userId !== session?.user?.id) {
          throw new Error('У вас нет прав на редактирование этого события');
        }
        
        setEvent(data);
      } catch (err) {
        console.error('Ошибка загрузки события:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Не удалось загрузить данные о рыболовном событии');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id && status === 'authenticated') {
      fetchEvent();
    }
  }, [id, status, session?.user?.id]);
  
  const handleCancel = () => {
    router.back();
  };
  
  // Если идет проверка авторизации
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }
  
  // Если пользователь не авторизован
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-6">
          Необходимо авторизоваться для редактирования события
        </div>
      </div>
    );
  }
  
  // Если событие загружается
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Загрузка данных события...</p>
        </div>
      </div>
    );
  }
  
  // Если произошла ошибка
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
        <button 
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          Вернуться назад
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Редактирование события</h1>
      
      <EditEventForm 
        eventId={id as string} 
        initialData={event}
        onCancel={handleCancel}
      />
    </div>
  );
} 