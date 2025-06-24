'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PlusCircle, Edit2, Trash2, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CreateTeamDialog } from './create-team-dialog';
import { ConfirmDialog } from '../ui/confirm-dialog';

interface Team {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function TeamsList({ userId }: { userId?: string }) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Загрузка списка команд
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const url = userId ? `/api/teams?userId=${userId}` : '/api/teams';
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Ошибка при загрузке списка команд');
      }
      
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error('Ошибка при загрузке списка команд:', error);
      toast.error('Не удалось загрузить список команд');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [userId]);

  // Обработчик создания новой команды
  const handleCreateTeam = async (teamData: { name: string; description?: string; logo?: string }) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка при создании команды');
      }
      
      const newTeam = await res.json();
      setTeams([newTeam, ...teams]);
      toast.success('Команда успешно создана');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Ошибка при создании команды:', error);
      toast.error(error.message || 'Не удалось создать команду');
    }
  };

  // Обработчик удаления команды
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      const res = await fetch(`/api/teams/${teamToDelete}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка при удалении команды');
      }
      
      setTeams(teams.filter(team => team.id !== teamToDelete));
      toast.success('Команда успешно удалена');
    } catch (error: any) {
      console.error('Ошибка при удалении команды:', error);
      toast.error(error.message || 'Не удалось удалить команду');
    } finally {
      setTeamToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Отображение скелетона при загрузке
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-60" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24 mr-2" />
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Команды</h2>
        {session?.user && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Создать команду
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {userId ? 'Вы не состоите ни в одной команде' : 'Нет доступных команд'}
            </p>
            {session?.user && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Создать свою команду
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    {team.logo ? (
                      <AvatarImage src={team.logo} alt={team.name} />
                    ) : (
                      <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>
                      Создана: {new Date(team.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">
                  {team.description || 'Нет описания'}
                </p>
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {team._count.members} {team._count.members === 1 ? 'участник' : 
                     team._count.members > 1 && team._count.members < 5 ? 'участника' : 'участников'}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    Владелец: {team.owner.name || team.owner.email}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/teams/${team.id}`} passHref>
                  <Button variant="secondary">Подробнее</Button>
                </Link>
                {session?.user?.id === team.ownerId && (
                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}/edit`} passHref>
                      <Button variant="outline" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        setTeamToDelete(team.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onSubmit={handleCreateTeam} 
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Удаление команды"
        description="Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDeleteTeam}
      />
    </div>
  );
} 