'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TeamOwner {
  id: string;
  name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  rating?: number;
  createdAt: string;
  owner: TeamOwner;
  _count: {
    members: number;
  }
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function TeamRatingsTable() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных о рейтинге команд
  const fetchRatings = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teams/ratings?page=${page}&limit=${pagination.limit}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке рейтинга команд');
      }
      
      const data = await response.json();
      
      // Добавляем временный рейтинг для команд, если его нет
      const teamsWithRating = data.teams.map((team: Team, index: number) => ({
        ...team,
        rating: team.rating || 1000 - index * 10, // Временное решение для отображения
      }));
      
      setTeams(teamsWithRating);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Ошибка загрузки рейтинга команд:', err);
      setError('Не удалось загрузить рейтинг команд');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchRatings();
  }, []);

  // Обработчик перехода на следующую страницу
  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchRatings(pagination.page + 1);
    }
  };

  // Обработчик перехода на предыдущую страницу
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchRatings(pagination.page - 1);
    }
  };

  // Функция для определения цвета значка рейтинга
  const getRatingBadgeColor = (rating: number): string => {
    if (rating >= 1500) return 'bg-yellow-500 hover:bg-yellow-600';
    if (rating >= 1200) return 'bg-blue-500 hover:bg-blue-600';
    return 'bg-gray-500 hover:bg-gray-600';
  };

  // Обработчик перехода на страницу команды
  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Рейтинг команд
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Загрузка рейтинга...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Команда</th>
                    <th className="text-center py-3 px-4 font-medium">Участники</th>
                    <th className="text-right py-3 px-4 font-medium">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => {
                    const position = (pagination.page - 1) * pagination.limit + index + 1;
                    return (
                      <tr 
                        key={team.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer" 
                        onClick={() => handleTeamClick(team.id)}
                      >
                        <td className="py-3 px-4">
                          {position <= 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                              {position}
                            </span>
                          ) : (
                            position
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} />
                              ) : (
                                <div className="bg-blue-100 w-full h-full flex items-center justify-center text-blue-600">
                                  {team.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{team.name}</div>
                              <div className="text-xs text-gray-500">
                                Капитан: {team.owner.name || team.owner.email.split('@')[0]}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>{team._count.members}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={getRatingBadgeColor(team.rating || 1000)}>
                            {team.rating || 1000}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Страница {pagination.page} из {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pagination.page === pagination.pages}
                  >
                    Вперед
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 