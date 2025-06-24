'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateEventFormProps {
  position: { lat: number; lng: number };
  onCancel: () => void;
  onCreated?: (eventId: string, lat: number, lng: number) => void;
}

export function CreateEventForm({ position, onCancel, onCreated }: CreateEventFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState('');
  const [fishTypes, setFishTypes] = useState('');
  const [weather, setWeather] = useState('');
  const [format, setFormat] = useState('solo');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      
      console.log('Отправляем данные для создания события:');
      console.log('Формат соревнования:', format);
      
      const requestData = {
        title,
        description,
        latitude: position.lat,
        longitude: position.lng,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        fishTypes,
        weather,
        format,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      };
      
      console.log('Данные запроса:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('/api/fishing/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Ошибка API:', data);
        throw new Error(data.error || 'Ошибка при создании события');
      }
      
      const event = await response.json();
      console.log('Событие успешно создано:', event);
      
      // Вызываем callback, если он предоставлен
      if (onCreated) {
        onCreated(event.id, position.lat, position.lng);
      } else {
        // Иначе перенаправляем как раньше
        router.push(`/fishing/map?lat=${position.lat}&lng=${position.lng}&zoom=13&eventId=${event.id}`);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при создании события');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2" 
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl">Создание рыболовного события</CardTitle>
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
                value={position.lat.toFixed(6)} 
                readOnly 
                className="bg-gray-50"
              />
              <Input 
                value={position.lng.toFixed(6)} 
                readOnly 
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
          {isLoading ? 'Создание...' : 'Создать событие'}
        </Button>
      </CardFooter>
    </Card>
  );
} 