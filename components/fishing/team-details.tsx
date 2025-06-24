'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Edit2, UserPlus, UserMinus, Calendar, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AddTeamMemberDialog } from './add-team-member-dialog';
import { ConfirmDialog } from '../ui/confirm-dialog';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  user: User;
}

interface FishingEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
}

interface TeamParticipation {
  id: string;
  teamId: string;
  fishingEventId: string;
  notes: string | null;
  createdAt: string;
  fishingEvent: FishingEvent;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  rating: number;
  ownerId: string;
  owner: User;
  members: TeamMember[];
  participations: TeamParticipation[];
  createdAt: string;
  updatedAt: string;
}

export function TeamDetails({ teamId }: { teamId: string }) {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);

  // Проверка, является ли текущий пользователь владельцем или администратором
  const isOwnerOrAdmin = () => {
    if (!session?.user || !team) return false;
    
    if (team.ownerId === session.user.id) return true;
    
    const currentMember = team.members.find(member => member.userId === session.user.id);
    return currentMember?.role === 'admin';
  };
  
  // Проверка, является ли текущий пользователь участником команды
  const isTeamMember = () => {
    if (!session?.user || !team) return false;
    return team.members.some(member => member.userId === session.user.id);
  };

  // Загрузка данных о команде
  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}`);
      
      if (!res.ok) {
        throw new Error('Ошибка при загрузке данных о команде');
      }
      
      const data = await res.json();
      setTeam(data);
    } catch (error) {
      console.error('Ошибка при загрузке данных о команде:', error);
      toast.error('Не удалось загрузить данные о команде');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  // Обработчик добавления участника в команду
  const handleAddMember = async (data: { userId?: string; email?: string; role?: string }) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка при добавлении участника');
      }
      
      const newMember = await res.json();
      setTeam(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: [...prev.members, newMember],
        };
      });
      
      toast.success('Участник успешно добавлен в команду');
      setIsAddMemberDialogOpen(false);
    } catch (error: any) {
      console.error('Ошибка при добавлении участника в команду:', error);
      toast.error(error.message || 'Не удалось добавить участника в команду');
    }
  };

  // Обработчик удаления участника из команды
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      const res = await fetch(`/api/teams/${teamId}/members?memberId=${memberToRemove}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка при удалении участника');
      }
      
      setTeam(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter(member => member.id !== memberToRemove),
        };
      });
      
      toast.success('Участник успешно удален из команды');
    } catch (error: any) {
      console.error('Ошибка при удалении участника из команды:', error);
      toast.error(error.message || 'Не удалось удалить участника из команды');
    } finally {
      setMemberToRemove(null);
      setIsRemoveMemberDialogOpen(false);
    }
  };

  // Функция для определения цвета значка рейтинга
  const getRatingBadgeColor = (rating: number): string => {
    if (rating >= 1500) return 'bg-yellow-500';
    if (rating >= 1200) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  // Отображение состояния загрузки
  if (loading) {
    return <div className="p-4">Загрузка данных о команде...</div>;
  }

  // Отображение ошибки, если команда не найдена
  if (!team) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Команда не найдена</p>
          <Link href="/teams" passHref>
            <Button variant="outline" className="mt-4">Вернуться к списку команд</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {team.logo ? (
                <AvatarImage src={team.logo} alt={team.name} />
              ) : (
                <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <Badge className={getRatingBadgeColor(team.rating)}>
                  <Trophy className="h-3 w-3 mr-1" /> {team.rating}
                </Badge>
              </div>
              <CardDescription>
                Создана: {new Date(team.createdAt).toLocaleDateString()}
              </CardDescription>
              <div className="mt-1">
                <span className="text-sm text-muted-foreground">
                  Владелец: {team.owner.name || team.owner.email}
                </span>
              </div>
            </div>
          </div>
          {isOwnerOrAdmin() && (
            <Link href={`/teams/${team.id}/edit`} passHref>
              <Button variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {team.description || 'Нет описания'}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Участники ({team.members.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="mr-2 h-4 w-4" />
            События ({team.participations.length})
          </TabsTrigger>
          <TabsTrigger value="rating">
            <Trophy className="mr-2 h-4 w-4" />
            Рейтинг
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Участники команды</CardTitle>
              {isOwnerOrAdmin() && (
                <Button onClick={() => setIsAddMemberDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Добавить участника
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {team.members.length === 0 ? (
                <p className="text-center text-muted-foreground">В команде нет участников</p>
              ) : (
                <div className="space-y-4">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {member.user.image ? (
                            <AvatarImage src={member.user.image} alt={member.user.name || member.user.email} />
                          ) : (
                            <AvatarFallback>
                              {(member.user.name || member.user.email).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name || member.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role === 'owner' ? 'Владелец' : 
                             member.role === 'admin' ? 'Администратор' : 'Участник'}
                          </p>
                        </div>
                      </div>
                      {(isOwnerOrAdmin() || session?.user?.id === member.userId) && 
                       member.role !== 'owner' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setMemberToRemove(member.id);
                            setIsRemoveMemberDialogOpen(true);
                          }}
                        >
                          <UserMinus className="h-4 w-4" />
                          {session?.user?.id === member.userId ? 'Выйти' : 'Удалить'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>События команды</CardTitle>
            </CardHeader>
            <CardContent>
              {team.participations.length === 0 ? (
                <p className="text-center text-muted-foreground">Команда не участвует ни в одном событии</p>
              ) : (
                <div className="space-y-4">
                  {team.participations.map((participation) => (
                    <div key={participation.id} className="border-b pb-2">
                      <Link href={`/fishing/events/${participation.fishingEventId}`} passHref>
                        <div className="cursor-pointer hover:bg-muted p-2 rounded-md">
                          <h3 className="font-medium">{participation.fishingEvent.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(participation.fishingEvent.startDate).toLocaleDateString()} 
                            {participation.fishingEvent.endDate && 
                              ` - ${new Date(participation.fishingEvent.endDate).toLocaleDateString()}`}
                          </p>
                          {participation.notes && (
                            <p className="text-sm mt-1 italic">{participation.notes}</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rating" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Рейтинг команды</CardTitle>
              <CardDescription>
                История рейтинга и достижения команды
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">{team.rating}</div>
                    <div className="text-sm text-muted-foreground mt-2">Текущий рейтинг</div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Как рассчитывается рейтинг?</h3>
                  <p className="text-sm text-muted-foreground">
                    Рейтинг команды рассчитывается на основе результатов соревнований. 
                    Каждая команда начинает с 1000 очков рейтинга. Рейтинг повышается за победы 
                    и снижается за поражения. Чем выше рейтинг соперника, тем больше очков вы получаете за победу.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалоги */}
      {isAddMemberDialogOpen && (
        <AddTeamMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          onSubmit={handleAddMember}
        />
      )}

      <ConfirmDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
        title="Удаление участника"
        description="Вы уверены, что хотите удалить этого участника из команды?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleRemoveMember}
      />
    </div>
  );
} 