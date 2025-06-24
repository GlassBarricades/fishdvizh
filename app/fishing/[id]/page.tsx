'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { FishingEvent } from '@/components/map/fishing-map';
import dynamic from 'next/dynamic';
import { ParticipantsList } from '@/components/fishing/participants-list';

// Динамический импорт Leaflet карты для детального просмотра
const DynamicMap = dynamic(
  () => import('@/components/map/detail-map').then(mod => mod.DetailMap),
  { ssr: false }
);

export default function FishingEventPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  console.log('Параметры URL:', params);
  console.log('ID события из URL:', id);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Проверка авторизации и перенаправление
  useEffect(() => {
    // Проверяем состояние авторизации
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/fishing/${id}`);
    }
  }, [status, router, id]);
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        console.log(`Загрузка события с ID: ${id}`);
        
        // Убедимся, что ID не содержит слово "events" (ошибка маршрутизации)
        if (id === 'events') {
          throw new Error('Неверный ID события');
        }
        
        // Исправляем URL для API-запроса - избегаем двойного /events/
        const apiUrl = `/api/fishing/events/${id}`;
        console.log(`Запрос к API: ${apiUrl}`);
        
        // Проверяем статус авторизации
        console.log('Статус авторизации:', status, 'Пользователь:', session?.user?.id);
        
        const response = await fetch(apiUrl);
        console.log('Получен ответ от API, статус:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('Ошибка API статус:', response.status, response.statusText);
          
          let errorMessage = 'Неизвестная ошибка';
          try {
            const errorData = await response.json();
            console.error('Данные ошибки API:', errorData);
            errorMessage = errorData.error || response.statusText || 'Неизвестная ошибка';
          } catch (parseError) {
            console.error('Не удалось прочитать ответ как JSON:', parseError);
          }
          
          throw new Error(`Ошибка при получении данных о событии: ${errorMessage}`);
        }
        
        const data = await response.json();
        console.log('Полученные данные:', data);
        setEvent(data);
      } catch (err: any) {
        console.error('Ошибка загрузки события:', err);
        setError(err.message || 'Не удалось загрузить данные о рыболовном событии');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Загружаем данные только если пользователь авторизован и ID валидный
    if (id && id !== 'events' && (status === 'authenticated')) {
      console.log('Начинаем загрузку данных о событии, ID:', id);
      fetchEvent();
    } else {
      console.log('Ожидание авторизации для загрузки данных или некорректный ID. Статус:', status, 'ID:', id);
      if (id === 'events') {
        setError('Некорректный ID события');
        setIsLoading(false);
      }
    }
  }, [id, status, session]);
  
  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/fishing/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении события');
      }
      
      // Перенаправление на карту
      router.push('/fishing/map');
      router.refresh();
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      setError('Не удалось удалить событие');
      setIsDeleting(false);
    }
  };
  
  // Если идет проверка авторизации, показываем загрузку
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }
  
  // Если пользователь не авторизован, показываем сообщение
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-6">
          Необходимо авторизоваться для просмотра события
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Загрузка данных события...</p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || 'Событие не найдено'}
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push('/fishing/map')}>
            Вернуться к карте
          </Button>
        </div>
      </div>
    );
  }
  
  const isOwner = session?.user?.id === event.userId;
  const formattedStartDate = new Date(event.startDate).toLocaleString();
  const formattedEndDate = event.endDate ? new Date(event.endDate).toLocaleString() : 'Не указано';
  
  // Преобразование формата соревнования для отображения
  const formatLabels: Record<string, string> = {
    solo: 'Сольное участие',
    team_2: 'Команда 2 человека',
    team_3: 'Команда 3 человека'
  };
  const formatLabel = formatLabels[event.format as keyof typeof formatLabels] || 'Сольное участие';
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <Button variant="outline" onClick={() => router.push('/fishing/map')}>
          Вернуться к карте
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о событии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Описание</h3>
                <p className="text-gray-600">{event.description || 'Описание отсутствует'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Дата начала</h3>
                  <p className="text-gray-600">{formattedStartDate}</p>
                </div>
                <div>
                  <h3 className="font-medium">Дата окончания</h3>
                  <p className="text-gray-600">{formattedEndDate}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Виды рыбы</h3>
                <p className="text-gray-600">{event.fishTypes || 'Не указано'}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Формат соревнования</h3>
                <p className="text-gray-600">{formatLabel}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Погодные условия</h3>
                <p className="text-gray-600">{event.weather || 'Не указано'}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Координаты</h3>
                <p className="text-gray-600">
                  {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Организатор</h3>
                <p className="text-gray-600">
                  {event.user?.name || event.user?.email || 'Неизвестно'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {event.format === 'solo' ? 'Участники' : 'Команды'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantsList 
                eventId={id as string} 
                maxParticipants={event.maxParticipants} 
                format={event.format || 'solo'}
              />
            </CardContent>
          </Card>
          
          {isOwner && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/fishing/${id}/edit`)}
              >
                Редактировать
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаление...' : 'Удалить событие'}
              </Button>
            </div>
          )}
        </div>
        
        <div>
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-md">
              <div className="h-[300px]">
                <DynamicMap 
                  latitude={event.latitude} 
                  longitude={event.longitude} 
                  title={event.title}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 