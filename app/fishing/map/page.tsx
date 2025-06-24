'use client';

import { useState, useEffect } from 'react';
import { FishingMap, FishingEvent } from '@/components/map/fishing-map';
import { CreateEventForm } from '@/components/fishing/create-event-form';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineEditForm } from '@/components/fishing/inline-edit-form';
import { ParticipantsList } from '@/components/fishing/participants-list';

// Предотвращает ошибку с реактивными компонентами на стороне сервера
const DynamicFishingMap = dynamic(
  () => import('@/components/map/fishing-map').then(mod => mod.FishingMap), 
  { ssr: false }
);

export default function FishingMapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [events, setEvents] = useState<FishingEvent[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [justCreatedEvent, setJustCreatedEvent] = useState<string | null>(null);
  
  // Состояние для отображения деталей события в разделенном экране
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [isLoadingEventData, setIsLoadingEventData] = useState(false);
  const [eventError, setEventError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Получаем параметры фокусировки карты из URL
  const focusParams = {
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    zoom: searchParams.get('zoom') ? parseInt(searchParams.get('zoom')!) : undefined,
    eventId: searchParams.get('eventId')
  };
  
  // Проверка авторизации на стороне клиента
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/fishing/map');
    }
  }, [status, router]);
  
  // Загрузка списка событий
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/fishing/events');
        
        if (!response.ok) {
          throw new Error('Ошибка при получении событий');
        }
        
        const data = await response.json();
        setEvents(data);
        
        // Если в URL есть eventId, запоминаем его как только что созданный
        // и устанавливаем для отображения деталей в разделенном экране
        if (focusParams.eventId) {
          setJustCreatedEvent(focusParams.eventId);
          setSelectedEventId(focusParams.eventId);
        }
        
        // Очищаем параметры URL после загрузки событий,
        // чтобы они не сохранялись при обновлении страницы
        if (focusParams.lat && focusParams.lng) {
          // Даем время для фокусировки карты, затем очищаем URL
          setTimeout(() => {
            router.replace('/fishing/map', { scroll: false });
          }, 1000);
        }
      } catch (err) {
        console.error('Ошибка загрузки событий:', err);
        setError('Не удалось загрузить события рыбалки');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Загружаем события только если пользователь авторизован
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, focusParams.lat, focusParams.lng, focusParams.eventId, router]);
  
  // Загрузка данных выбранного события для разделенного экрана
  useEffect(() => {
    const fetchEventDetails = async (eventId: string) => {
      try {
        setIsLoadingEventData(true);
        setEventError('');
        
        const response = await fetch(`/api/fishing/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Ошибка при получении данных о событии');
        }
        
        const data = await response.json();
        setSelectedEventData(data);
      } catch (err) {
        console.error('Ошибка загрузки деталей события:', err);
        setEventError('Не удалось загрузить данные о событии');
      } finally {
        setIsLoadingEventData(false);
      }
    };
    
    if (selectedEventId) {
      fetchEventDetails(selectedEventId);
    } else {
      setSelectedEventData(null);
    }
  }, [selectedEventId]);
  
  const handleEventCreate = (position: { lat: number; lng: number }) => {
    setSelectedPosition(position);
    // Закрываем панель деталей при создании нового события
    setSelectedEventId(null);
  };
  
  const handleCancelCreate = () => {
    setSelectedPosition(null);
  };
  
  const handleEventCreated = (eventId: string, lat: number, lng: number) => {
    setSelectedPosition(null);
    setJustCreatedEvent(eventId);
    setSelectedEventId(eventId);
    
    // Перезагружаем события, чтобы включить новое событие
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/fishing/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Ошибка обновления событий:', err);
      }
    };
    
    fetchEvents();
  };
  
  // Обработчик выбора события на карте
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setJustCreatedEvent(eventId);
    
    // Инвалидируем размер карты после изменения размера контейнера
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 100);
  };
  
  // Обработка изменения размера окна браузера
  useEffect(() => {
    const handleResize = () => {
      // Вызываем событие resize для обновления карты
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Закрытие панели деталей события
  const handleCloseEventDetails = () => {
    setSelectedEventId(null);
    setIsEditMode(false);
    
    // Инвалидируем размер карты после изменения размера контейнера
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 100);
  };
  
  // Переключение в режим редактирования
  const handleEditModeToggle = () => {
    setIsEditMode(true);
  };
  
  // Отмена редактирования
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };
  
  // Обработчик успешного обновления события
  const handleEventUpdated = async (eventId: string) => {
    setIsEditMode(false);
    
    // Обновляем данные события
    try {
      setIsLoadingEventData(true);
      const response = await fetch(`/api/fishing/events/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при получении обновленных данных о событии');
      }
      
      const data = await response.json();
      setSelectedEventData(data);
      
      // Обновляем список всех событий
      const eventsResponse = await fetch('/api/fishing/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Ошибка обновления данных события:', err);
      setEventError('Не удалось загрузить обновленные данные о событии');
    } finally {
      setIsLoadingEventData(false);
    }
  };
  
  // Обработчик удаления события
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/fishing/events/${selectedEventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении события');
      }
      
      // Закрываем панель деталей
      setSelectedEventId(null);
      
      // Обновляем список событий
      const updatedEvents = events.filter(event => event.id !== selectedEventId);
      setEvents(updatedEvents);
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      setEventError('Не удалось удалить событие');
    }
  };
  
  // Переход на полную страницу события
  const handleViewFullEvent = (eventId: string) => {
    router.push(`/fishing/${eventId}`);
  };
  
  // Если идет проверка авторизации, показываем загрузку
  if (status === 'loading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p>Проверка авторизации...</p>
      </div>
    );
  }
  
  // Если пользователь не авторизован, показываем сообщение
  if (status === 'unauthenticated') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md max-w-lg">
          Необходимо авторизоваться для доступа к карте
        </div>
      </div>
    );
  }
  
  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Преобразование формата соревнования для отображения
  const getFormatLabel = (format: string): string => {
    const formatLabels: Record<string, string> = {
      solo: 'Сольное участие',
      team_2: 'Команда 2 человека',
      team_3: 'Команда 3 человека'
    };
    return formatLabels[format] || 'Сольное участие';
  };
  
  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ minHeight: '100vh' }}>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-2 m-2 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <p>Загрузка карты и событий...</p>
        </div>
      ) : (
        <div className="flex-1 flex relative">
          {/* Карта (занимает весь экран или левую часть при разделении) */}
          <div className={`relative ${selectedEventId ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`} 
            style={{ minHeight: '100%' }}>
            <DynamicFishingMap 
              events={events} 
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
              focusPosition={focusParams.lat && focusParams.lng ? {
                lat: focusParams.lat,
                lng: focusParams.lng,
                zoom: focusParams.zoom || 7
              } : undefined}
              focusEventId={justCreatedEvent || focusParams.eventId || undefined}
            />
          </div>
          
          {/* Панель деталей события (правая часть при разделении) */}
          {selectedEventId && (
            <div className="w-1/2 h-full bg-white border-l overflow-y-auto" style={{ minHeight: '100%' }}>
              <div className="p-4 relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2"
                  onClick={isEditMode ? handleCancelEdit : handleCloseEventDetails}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                {isLoadingEventData ? (
                  <div className="flex items-center justify-center h-64">
                    <p>Загрузка данных события...</p>
                  </div>
                ) : eventError ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {eventError}
                  </div>
                ) : selectedEventData ? (
                  isEditMode ? (
                    <InlineEditForm 
                      eventId={selectedEventId}
                      eventData={selectedEventData}
                      onCancel={handleCancelEdit}
                      onUpdated={handleEventUpdated}
                    />
                  ) : (
                    <div className="space-y-4 pt-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedEventData.title}</h2>
                        <p className="text-gray-600">{selectedEventData.description || 'Описание отсутствует'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium">Дата начала</h3>
                          <p className="text-gray-600">{formatDate(selectedEventData.startDate)}</p>
                        </div>
                        <div>
                          <h3 className="font-medium">Дата окончания</h3>
                          <p className="text-gray-600">
                            {selectedEventData.endDate ? formatDate(selectedEventData.endDate) : 'Не указано'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Виды рыбы</h3>
                        <p className="text-gray-600">{selectedEventData.fishTypes || 'Не указано'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Формат соревнования</h3>
                        <p className="text-gray-600">{getFormatLabel(selectedEventData.format || 'solo')}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Погодные условия</h3>
                        <p className="text-gray-600">{selectedEventData.weather || 'Не указано'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Координаты</h3>
                        <p className="text-gray-600">
                          {selectedEventData.latitude.toFixed(6)}, {selectedEventData.longitude.toFixed(6)}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Организатор</h3>
                        <p className="text-gray-600">
                          {selectedEventData.user?.name || selectedEventData.user?.email || 'Неизвестно'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Количество участников</h3>
                        <p className="text-gray-600">
                          {selectedEventData.maxParticipants !== null 
                            ? `Ограничено: ${selectedEventData.maxParticipants}`
                            : 'Без ограничений'}
                        </p>
                      </div>
                      
                      {/* Список участников */}
                      <div className="border-t pt-4 mt-2">
                        <ParticipantsList 
                          eventId={selectedEventId} 
                          maxParticipants={selectedEventData.maxParticipants}
                          format={selectedEventData.format || 'solo'}
                        />
                      </div>
                      
                      {/* Кнопки действий */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          onClick={() => handleViewFullEvent(selectedEventId)}
                        >
                          Открыть страницу события
                        </Button>
                        
                        {selectedEventData.userId === session?.user?.id && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleEditModeToggle}
                            >
                              Редактировать
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteEvent}
                            >
                              Удалить событие
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div>Событие не найдено</div>
                )}
              </div>
            </div>
          )}
          
          {/* Форма создания события */}
          {selectedPosition && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-lg">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
                <CreateEventForm 
                  position={selectedPosition} 
                  onCancel={handleCancelCreate}
                  onCreated={handleEventCreated}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 