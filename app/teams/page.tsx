'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Loader2, Edit, Trash, UserPlus, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  
  // Загружаем команды пользователя
  const fetchTeams = async () => {
    if (status !== 'authenticated') return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/teams');
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке команд');
      }
      
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error('Ошибка загрузки команд:', err);
      setError('Не удалось загрузить команды');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Загружаем команды при авторизации
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status]);
  
  // Обработчик создания команды
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      setError('Введите название команды');
      return;
    }
    
    try {
      setIsCreating(true);
      setError('');
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при создании команды');
      }
      
      // Обновляем список команд
      await fetchTeams();
      setShowCreateForm(false);
      setTeamName('');
      setTeamDescription('');
    } catch (err) {
      console.error('Ошибка создания команды:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при создании команды');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Получаем инициалы пользователя
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Проверяем, является ли пользователь владельцем команды
  const isTeamOwner = (team: Team) => {
    return team.ownerId === session?.user?.id;
  };
  
  // Обработчик редактирования команды
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setIsEditing(true);
  };
  
  // Сохранение изменений команды
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTeam) return;
    
    if (!teamName.trim()) {
      setError('Введите название команды');
      return;
    }
    
    try {
      setIsEditing(true);
      setError('');
      
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при обновлении команды');
      }
      
      // Обновляем список команд
      await fetchTeams();
      setIsEditing(false);
      setEditingTeam(null);
      setTeamName('');
      setTeamDescription('');
    } catch (err) {
      console.error('Ошибка редактирования команды:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при редактировании команды');
    } finally {
      setIsEditing(false);
    }
  };
  
  // Обработчик удаления команды
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту команду?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setError('');
      
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении команды');
      }
      
      // Обновляем список команд
      await fetchTeams();
    } catch (err) {
      console.error('Ошибка удаления команды:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при удалении команды');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Обработчик открытия формы добавления участника
  const handleShowAddMemberForm = (teamId: string) => {
    setSelectedTeamId(teamId);
    setNewMemberEmail('');
    setShowAddMemberForm(true);
  };
  
  // Обработчик добавления участника в команду
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamId) return;
    
    if (!newMemberEmail.trim()) {
      setError('Введите email пользователя');
      return;
    }
    
    try {
      setIsAddingMember(true);
      setError('');
      
      const response = await fetch(`/api/teams/${selectedTeamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при добавлении участника');
      }
      
      // Обновляем список команд
      await fetchTeams();
      setShowAddMemberForm(false);
      setNewMemberEmail('');
      setSelectedTeamId(null);
    } catch (err) {
      console.error('Ошибка добавления участника:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении участника');
    } finally {
      setIsAddingMember(false);
    }
  };
  
  // Обработчик удаления участника из команды
  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого участника из команды?')) {
      return;
    }
    
    try {
      setIsDeletingMember(true);
      setError('');
      
      const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении участника');
      }
      
      // Обновляем список команд
      await fetchTeams();
    } catch (err) {
      console.error('Ошибка удаления участника:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при удалении участника');
    } finally {
      setIsDeletingMember(false);
    }
  };
  
  // Если идет проверка авторизации, показываем загрузку
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }
  
  // Если пользователь не авторизован, показываем сообщение
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-6">
          Необходимо авторизоваться для управления командами
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Мои команды</h1>
            <p className="text-muted-foreground">Управление командами для участия в соревнованиях</p>
          </div>
          
          {!showCreateForm && !isEditing && (
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Создать команду</span>
            </Button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Форма создания команды */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Создание новой команды</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium mb-1">
                    Название команды *
                  </label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Введите название команды"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="teamDescription" className="block text-sm font-medium mb-1">
                    Описание
                  </label>
                  <Textarea
                    id="teamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Описание команды (необязательно)"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setTeamName('');
                      setTeamDescription('');
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Создать команду'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Форма редактирования команды */}
        {isEditing && editingTeam && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Редактирование команды</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveTeam} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="editTeamName" className="text-sm font-medium">
                    Название команды *
                  </label>
                  <Input
                    id="editTeamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Введите название команды"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="editTeamDescription" className="text-sm font-medium">
                    Описание команды
                  </label>
                  <Textarea
                    id="editTeamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Описание команды (необязательно)"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingTeam(null);
                      setError('');
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isEditing}>
                    {isEditing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Форма добавления участника */}
        {showAddMemberForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Добавление участника в команду</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newMemberEmail" className="text-sm font-medium">
                    Email пользователя *
                  </label>
                  <Input
                    id="newMemberEmail"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Введите email пользователя"
                    type="email"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Пользователь должен быть зарегистрирован в системе.
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddMemberForm(false);
                      setSelectedTeamId(null);
                      setNewMemberEmail('');
                      setError('');
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isAddingMember}>
                    {isAddingMember ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Добавление...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Добавить участника
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">У вас пока нет команд</h3>
            <p className="text-gray-600 mb-4">
              Создайте свою первую команду для участия в командных соревнованиях
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать команду
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between">
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    {isTeamOwner(team) && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Редактировать"
                          onClick={() => handleEditTeam(team)}
                          disabled={isEditing || isDeleting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Удалить"
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={isEditing || isDeleting}
                        >
                          {isDeleting ? 
                            <Loader2 className="h-4 w-4 animate-spin" /> :
                            <Trash className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {team.description && (
                    <p className="text-gray-600 mb-4">{team.description}</p>
                  )}
                  
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Участники команды ({team.members.length})</h4>
                    <div className="space-y-2">
                      {team.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={member.user.image || ''} 
                              alt={member.user.name || member.user.email || ''} 
                            />
                            <AvatarFallback>
                              {getInitials(member.user.name || member.user.email || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.user.name || member.user.email || 'Участник'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.role === 'owner' ? 'Владелец' : 'Участник'}
                            </div>
                          </div>
                          {isTeamOwner(team) && member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Удалить участника"
                              onClick={() => handleRemoveMember(team.id, member.id)}
                              disabled={isDeletingMember}
                            >
                              {isDeletingMember ? 
                                <Loader2 className="h-4 w-4 animate-spin" /> : 
                                <UserMinus className="h-4 w-4" />
                              }
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isTeamOwner(team) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleShowAddMemberForm(team.id)}
                        disabled={isAddingMember}
                      >
                        {isAddingMember ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Добавить участника
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 