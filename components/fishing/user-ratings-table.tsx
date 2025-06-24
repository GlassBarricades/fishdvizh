'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  rating?: number; // Сделаем поле опциональным
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function UserRatingsTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных о рейтинге пользователей
  const fetchRatings = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/ratings?page=${page}&limit=${pagination.limit}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке рейтинга пользователей');
      }
      
      const data = await response.json();
      
      // Добавляем временный рейтинг для пользователей, если его нет
      const usersWithRating = data.users.map((user: User, index: number) => ({
        ...user,
        rating: user.rating || 1000 - index * 10, // Временное решение для отображения
      }));
      
      setUsers(usersWithRating);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Ошибка загрузки рейтинга:', err);
      setError('Не удалось загрузить рейтинг пользователей');
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

  // Функция для отображения имени или email пользователя
  const getUserDisplayName = (user: User): string => {
    return user.name || user.email.split('@')[0];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Рейтинг игроков
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
                    <th className="text-left py-3 px-4 font-medium">Игрок</th>
                    <th className="text-right py-3 px-4 font-medium">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const position = (pagination.page - 1) * pagination.limit + index + 1;
                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
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
                              {user.image ? (
                                <img src={user.image} alt={getUserDisplayName(user)} />
                              ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-600">
                                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </Avatar>
                            <span>{getUserDisplayName(user)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className={getRatingBadgeColor(user.rating || 1000)}>
                            {user.rating || 1000}
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