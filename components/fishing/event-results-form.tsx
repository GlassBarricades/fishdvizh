'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Plus, Trash2, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Participant {
  id: string;
  name: string;
  type: 'user' | 'team';
}

interface Result {
  participantId: string;
  participantType: 'user' | 'team';
  place: number;
  score: number;
}

interface EventResultsFormProps {
  eventId: string;
  isOwner: boolean;
}

export function EventResultsForm({ eventId, isOwner }: EventResultsFormProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Загрузка участников и результатов
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Загружаем индивидуальных участников
        const userResponse = await fetch(`/api/fishing/events/${eventId}/participants`);
        if (!userResponse.ok) {
          throw new Error('Ошибка при загрузке участников');
        }
        const userData = await userResponse.json();
        const userParticipants = userData.map((p: any) => ({
          id: p.userId || p.id,
          name: p.name,
          type: 'user' as const,
        }));

        // Загружаем команды-участники
        const teamResponse = await fetch(`/api/fishing/events/${eventId}/teams`);
        if (!teamResponse.ok) {
          throw new Error('Ошибка при загрузке команд');
        }
        const teamData = await teamResponse.json();
        const teamParticipants = teamData.map((t: any) => ({
          id: t.teamId || t.id,
          name: t.team?.name || t.name,
          type: 'team' as const,
        }));

        // Объединяем участников
        setParticipants([...userParticipants, ...teamParticipants]);

        // Загружаем результаты, если они есть
        const resultsResponse = await fetch(`/api/fishing/events/${eventId}/results`);
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          setResults(resultsData);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные участников или результатов');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Добавление нового результата
  const handleAddResult = () => {
    // Находим участника, который еще не имеет результата
    const usedParticipantIds = results.map(r => r.participantId);
    const availableParticipant = participants.find(p => !usedParticipantIds.includes(p.id));

    if (availableParticipant) {
      const newResult: Result = {
        participantId: availableParticipant.id,
        participantType: availableParticipant.type,
        place: results.length + 1,
        score: 0,
      };
      setResults([...results, newResult]);
    }
  };

  // Удаление результата
  const handleRemoveResult = (index: number) => {
    const updatedResults = [...results];
    updatedResults.splice(index, 1);
    
    // Пересчитываем места
    const sortedResults = [...updatedResults].sort((a, b) => b.score - a.score);
    sortedResults.forEach((result, idx) => {
      result.place = idx + 1;
    });
    
    setResults(sortedResults);
  };

  // Обновление места
  const handlePlaceChange = (index: number, value: string) => {
    const place = parseInt(value);
    if (isNaN(place) || place < 1) return;

    const updatedResults = [...results];
    updatedResults[index].place = place;
    setResults(updatedResults);
  };

  // Обновление очков
  const handleScoreChange = (index: number, value: string) => {
    const score = parseInt(value);
    if (isNaN(score)) return;

    const updatedResults = [...results];
    updatedResults[index].score = score;
    setResults(updatedResults);
  };

  // Обновление участника
  const handleParticipantChange = (index: number, participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const updatedResults = [...results];
    updatedResults[index].participantId = participantId;
    updatedResults[index].participantType = participant.type;
    setResults(updatedResults);
  };

  // Сохранение результатов
  const handleSaveResults = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Проверяем, что все места уникальны
      const places = results.map(r => r.place);
      if (new Set(places).size !== places.length) {
        setError('Места должны быть уникальными');
        return;
      }

      // Отправляем данные на сервер
      const response = await fetch(`/api/fishing/events/${eventId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при сохранении результатов');
      }

      setSuccess('Результаты успешно сохранены');
    } catch (err) {
      console.error('Ошибка сохранения результатов:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить результаты');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Получение имени участника по ID
  const getParticipantName = (id: string): string => {
    const participant = participants.find(p => p.id === id);
    return participant?.name || 'Неизвестный участник';
  };

  // Получение типа участника (текст)
  const getParticipantTypeText = (type: 'user' | 'team'): string => {
    return type === 'user' ? 'Участник' : 'Команда';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Результаты соревнования
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">
                {success}
              </div>
            )}

            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isOwner 
                  ? 'Нет результатов. Добавьте результаты участников соревнования.' 
                  : 'Результаты соревнования еще не опубликованы.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Место</th>
                      <th className="text-left py-3 px-4 font-medium">Участник</th>
                      <th className="text-left py-3 px-4 font-medium">Тип</th>
                      <th className="text-right py-3 px-4 font-medium">Очки</th>
                      {isOwner && (
                        <th className="text-right py-3 px-4 font-medium">Действия</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .sort((a, b) => a.place - b.place)
                      .map((result, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {isOwner ? (
                              <Input
                                type="number"
                                min="1"
                                value={result.place}
                                onChange={(e) => handlePlaceChange(index, e.target.value)}
                                className="w-16"
                              />
                            ) : (
                              <Badge className={result.place <= 3 ? 'bg-yellow-500' : 'bg-gray-500'}>
                                {result.place}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isOwner ? (
                              <Select
                                value={result.participantId}
                                onValueChange={(value) => handleParticipantChange(index, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Выберите участника" />
                                </SelectTrigger>
                                <SelectContent>
                                  {participants.map((participant) => (
                                    <SelectItem key={participant.id} value={participant.id}>
                                      {participant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              getParticipantName(result.participantId)
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {getParticipantTypeText(result.participantType)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isOwner ? (
                              <Input
                                type="number"
                                value={result.score}
                                onChange={(e) => handleScoreChange(index, e.target.value)}
                                className="w-24 ml-auto"
                              />
                            ) : (
                              result.score
                            )}
                          </td>
                          {isOwner && (
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveResult(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {isOwner && (
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={handleAddResult}
                  disabled={isSubmitting || participants.length <= results.length}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить результат
                </Button>
                <Button
                  onClick={handleSaveResults}
                  disabled={isSubmitting || results.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить результаты
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 