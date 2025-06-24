'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserMinus, Loader2, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParticipantsListProps {
  eventId: string;
  maxParticipants: number | null;
  format: string; // Добавляем формат соревнования: solo, team_2, team_3
}

interface Participant {
  id: string;
  name: string;
  contact?: string;
  notes?: string;
  createdAt: string;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }>;
}

export function ParticipantsList({ eventId, maxParticipants, format }: ParticipantsListProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Определяем, является ли формат командным
  const isTeamFormat = format === 'team_2' || format === 'team_3';
  
  // Получаем размер команды в зависимости от формата
  const getTeamSize = () => {
    if (format === 'team_2') return 2;
    if (format === 'team_3') return 3;
    return 1;
  };
  
  // Проверяем, зарегистрирован ли текущий пользователь
  const isCurrentUserRegistered = participants.some(
    p => p.userId === session?.user?.id
  );
  
  // Проверяем, зарегистрирована ли команда пользователя
  const isUserTeamRegistered = teams.some(team => 
    team.ownerId === session?.user?.id || 
    team.members.some(member => member.userId === session?.user?.id)
  );
  
  // Проверяем, достигнут ли лимит участников
  const isParticipantLimitReached = 
    maxParticipants !== null && 
    (isTeamFormat 
      ? teams.length * getTeamSize() >= maxParticipants
      : participants.length >= maxParticipants);
  
  // Загружаем список участников
  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log(`Загрузка участников для события ${eventId}...`);
      const response = await fetch(`/api/fishing/participants?eventId=${eventId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка ответа API:', response.status, errorData);
        throw new Error(errorData.error || `Ошибка ${response.status}: Не удалось загрузить список участников`);
      }
      
      const data = await response.json();
      console.log(`Загружено ${data.length} участников`);
      setParticipants(data);
      
      // Если формат командный, загружаем команды
      if (isTeamFormat) {
        await fetchTeams();
      }
    } catch (err) {
      console.error('Ошибка загрузки участников:', err);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить список участников');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Загружаем список команд для события
  const fetchTeams = async () => {
    if (!isTeamFormat) return;
    
    try {
      console.log(`Загрузка команд для события ${eventId}...`);
      const response = await fetch(`/api/fishing/events/${eventId}/teams`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка загрузки команд:', response.status, errorData);
        throw new Error(errorData.error || `Ошибка ${response.status}: Не удалось загрузить список команд`);
      }
      
      const data = await response.json();
      console.log(`Загружено ${data.length} команд`);
      setTeams(data);
    } catch (err) {
      console.error('Ошибка загрузки команд:', err);
      // Не прерываем основной поток, просто логируем ошибку
    }
  };
  
  // Загружаем команды пользователя
  const fetchUserTeams = async () => {
    if (!isTeamFormat || !session?.user) return;
    
    try {
      setIsLoadingTeams(true);
      console.log(`Загрузка команд пользователя...`);
      const response = await fetch(`/api/teams?userId=${session.user.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка загрузки команд пользователя:', response.status, errorData);
        throw new Error(errorData.error || `Ошибка ${response.status}: Не удалось загрузить команды пользователя`);
      }
      
      const data = await response.json();
      console.log(`Загружено ${data.length} команд пользователя`);
      
      // Фильтруем команды по размеру в соответствии с форматом
      const filteredTeams = data.filter(team => {
        const teamSize = team.members.length;
        return (format === 'team_2' && teamSize === 2) || 
               (format === 'team_3' && teamSize === 3);
      });
      
      setUserTeams(filteredTeams);
      
      // Если есть команды, автоматически выбираем первую
      if (filteredTeams.length > 0) {
        setSelectedTeamId(filteredTeams[0].id);
      }
    } catch (err) {
      console.error('Ошибка загрузки команд пользователя:', err);
      // Не прерываем основной поток, просто логируем ошибку
    } finally {
      setIsLoadingTeams(false);
    }
  };
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchParticipants();
  }, [eventId, format]);
  
  // Загружаем команды пользователя при открытии формы регистрации
  useEffect(() => {
    if (showRegistrationForm && isTeamFormat) {
      fetchUserTeams();
    }
  }, [showRegistrationForm, isTeamFormat, session]);
  
  // Обработчик индивидуальной регистрации на событие
  const handleRegister = async () => {
    if (!session?.user) {
      setError('Необходимо авторизоваться для регистрации');
      return;
    }
    
    if (isTeamFormat) {
      handleTeamRegister();
      return;
    }
    
    try {
      setIsRegistering(true);
      setError('');
      
      const response = await fetch(`/api/fishing/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, notes }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при регистрации на событие');
      }
      
      // Обновляем список участников
      fetchParticipants();
      setShowRegistrationForm(false);
      setNotes('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при регистрации на событие');
      }
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Обработчик командной регистрации
  const handleTeamRegister = async () => {
    if (!session?.user) {
      setError('Необходимо авторизоваться для регистрации команды');
      return;
    }
    
    if (!selectedTeamId) {
      setError('Необходимо выбрать команду для регистрации');
      return;
    }
    
    try {
      setIsRegistering(true);
      setError('');
      
      const response = await fetch(`/api/fishing/events/${eventId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          teamId: selectedTeamId,
          notes 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при регистрации команды на событие');
      }
      
      // Обновляем список участников и команд
      fetchParticipants();
      setShowRegistrationForm(false);
      setNotes('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при регистрации команды на событие');
      }
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Обработчик отмены регистрации
  const handleUnregister = async () => {
    if (!session?.user) {
      setError('Необходимо авторизоваться для отмены регистрации');
      return;
    }
    
    if (!confirm('Вы уверены, что хотите отменить свою регистрацию?')) {
      return;
    }
    
    try {
      setIsUnregistering(true);
      setError('');
      
      // Определяем, какой тип отмены регистрации нужен
      if (isTeamFormat) {
        // Находим команду пользователя, которая участвует в событии
        const userTeam = teams.find(team => 
          team.ownerId === session.user?.id || 
          team.members.some(member => member.userId === session.user?.id)
        );
        
        if (!userTeam) {
          throw new Error('Ваша команда не зарегистрирована на это событие');
        }
        
        const response = await fetch(`/api/fishing/events/${eventId}/teams?teamId=${userTeam.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка при отмене регистрации команды');
        }
      } else {
        // Отмена индивидуальной регистрации
        const response = await fetch(`/api/fishing/participants?eventId=${eventId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Ошибка при отмене регистрации');
        }
      }
      
      // Обновляем список участников
      fetchParticipants();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при отмене регистрации');
      }
    } finally {
      setIsUnregistering(false);
    }
  };
  
  // Получаем инициалы из имени для аватара
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        {isTeamFormat ? 'Команды' : 'Участники'} 
        {maxParticipants !== null && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({isTeamFormat ? teams.length : participants.length} / {maxParticipants})
          </span>
        )}
      </h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : isTeamFormat ? (
        // Отображение списка команд
        teams.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Пока ни одна команда не зарегистрировалась
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => (
              <div 
                key={team.id} 
                className="p-3 rounded-md bg-gray-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{team.name}</h4>
                  {(team.ownerId === session?.user?.id || team.members.some(m => m.userId === session?.user?.id)) && (
                    <div className="text-xs text-green-600 font-medium">Ваша команда</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {team.members.map(member => (
                    <div key={member.id} className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage 
                          src={member.user?.image || ''} 
                          alt={member.user?.name || member.user?.email || ''} 
                        />
                        <AvatarFallback>
                          {getInitials(member.user?.name || member.user?.email || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.user?.name || member.user?.email || 'Участник команды'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Отображение списка индивидуальных участников
        participants.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Пока никто не зарегистрировался
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map(participant => (
              <div 
                key={participant.id} 
                className="flex items-center gap-3 p-2 rounded-md bg-gray-50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={participant.user?.image || ''} 
                    alt={participant.name} 
                  />
                  <AvatarFallback>
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{participant.name}</div>
                  {participant.notes && (
                    <div className="text-sm text-gray-500">{participant.notes}</div>
                  )}
                </div>
                {participant.userId === session?.user?.id && (
                  <div className="text-xs text-green-600 font-medium">Вы</div>
                )}
              </div>
            ))}
          </div>
        )
      )}
      
      {session?.user && !isLoading && (
        <div className="pt-2">
          {(isCurrentUserRegistered || (isTeamFormat && isUserTeamRegistered)) ? (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleUnregister}
              disabled={isUnregistering}
            >
              {isUnregistering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Отменить регистрацию {isTeamFormat ? 'команды' : ''}
            </Button>
          ) : showRegistrationForm ? (
            <div className="space-y-3">
              {isTeamFormat && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Выберите команду для регистрации
                  </label>
                  {isLoadingTeams ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Загрузка команд...
                    </div>
                  ) : userTeams.length === 0 ? (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      У вас нет подходящих команд для этого формата соревнования ({format === 'team_2' ? '2 человека' : '3 человека'}).
                      Создайте команду нужного размера перед регистрацией.
                    </div>
                  ) : (
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                      disabled={userTeams.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите команду" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.members.length} участников)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              <Textarea
                placeholder="Комментарий к регистрации (необязательно)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowRegistrationForm(false)}
                >
                  Отмена
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleRegister}
                  disabled={
                    isRegistering || 
                    isParticipantLimitReached || 
                    (isTeamFormat && (userTeams.length === 0 || !selectedTeamId))
                  }
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isTeamFormat ? (
                    <Users className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Зарегистрироваться
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={() => setShowRegistrationForm(true)}
              disabled={isParticipantLimitReached}
            >
              {isTeamFormat ? (
                <Users className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isParticipantLimitReached 
                ? "Достигнут лимит участников" 
                : isTeamFormat 
                  ? "Зарегистрировать команду"
                  : "Зарегистрироваться на событие"
              }
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 