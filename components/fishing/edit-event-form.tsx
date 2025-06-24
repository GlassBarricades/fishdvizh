'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditEventFormProps {
  eventId: string;
  initialData?: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    startDate: string;
    endDate?: string;
    fishTypes?: string;
    weather?: string;
    format?: string;
    maxParticipants?: number;
  };
  onCancel: () => void;
}

export function EditEventForm({ eventId, initialData, onCancel }: EditEventFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(
    initialData?.startDate 
      ? new Date(initialData.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate 
      ? new Date(initialData.endDate).toISOString().slice(0, 16)
      : ''
  );
  const [latitude, setLatitude] = useState(initialData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialData?.longitude || 0);
  const [fishTypes, setFishTypes] = useState(initialData?.fishTypes || '');
  const [weather, setWeather] = useState(initialData?.weather || '');
  const [format, setFormat] = useState(initialData?.format || 'solo');
  const [maxParticipants, setMaxParticipants] = useState<string>(
    initialData?.maxParticipants !== undefined && initialData?.maxParticipants !== null
      ? initialData.maxParticipants.toString()
      : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Загружаем данные события, если initialData не предоставлен
  useEffect(() => {
    const fetchEventData = async () => {
      if (initialData) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/fishing/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные события');
        }
        
        const data = await response.json();
        
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLatitude(data.latitude || 0);
        setLongitude(data.longitude || 0);
        setStartDate(data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
        setEndDate(data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '');
        setFishTypes(data.fishTypes || '');
        setWeather(data.weather || '');
        setFormat(data.format || 'solo');
        setMaxParticipants(
          data.maxParticipants !== undefined && data.maxParticipants !== null
            ? data.maxParticipants.toString()
            : ''
        );
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Произошла ошибка при загрузке данных события');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId, initialData]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startDate) {
      setError('Заполните обязательные поля');
      return;
    }
    
    if (!session?.user) {
      setError('Необходимо авторизоваться');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Отправляем данные для обновления события:');
      console.log('ID события:', eventId);
      console.log('Формат соревнования:', format);
      
      const requestData = {
        title,
        description,
        latitude,
        longitude,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        fishTypes,
        weather,
        format,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      };
      
      console.log('Данные запроса:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch(`/api/fishing/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Ошибка API:', data);
        throw new Error(data.error || 'Ошибка при обновлении события');
      }
      
      const updatedEvent = await response.json();
      console.log('Событие успешно обновлено:', updatedEvent);
      
      // Перенаправляем на страницу детального просмотра события
      router.push(`/fishing/${eventId}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при обновлении события');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-2 top-2" 
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl text-center">Редактирование события</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Координаты
            </label>
            <div className="flex gap-2">
              <Input 
                value={latitude.toFixed(6)} 
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="bg-gray-50"
              />
              <Input 
                value={longitude.toFixed(6)} 
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Название события *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Ловля карпа на озере"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Описание
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о событии"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-sm font-medium">
                Дата начала *
              </label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="endDate" className="text-sm font-medium">
                Дата окончания
              </label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="format" className="text-sm font-medium">
              Формат соревнования *
            </label>
            <Select
              value={format}
              onValueChange={setFormat}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Выберите формат соревнования" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Сольное участие</SelectItem>
                <SelectItem value="team_2">Команда 2 человека</SelectItem>
                <SelectItem value="team_3">Команда 3 человека</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="fishTypes" className="text-sm font-medium">
              Виды рыбы
            </label>
            <Input
              id="fishTypes"
              value={fishTypes}
              onChange={(e) => setFishTypes(e.target.value)}
              placeholder="Например: карп, щука, окунь"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="weather" className="text-sm font-medium">
              Погодные условия
            </label>
            <Input
              id="weather"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="Например: солнечно, 25°C"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="maxParticipants" className="text-sm font-medium">
              Максимальное количество участников
            </label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Оставьте пустым для неограниченного количества"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </CardFooter>
    </Card>
  );
} 