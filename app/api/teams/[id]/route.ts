import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить информацию о команде
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    // Получаем детальную информацию о команде
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }
    
    // Проверяем, имеет ли пользователь доступ к команде
    const isMember = team.members.some((member: any) => member.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: 'У вас нет доступа к этой команде' }, { status: 403 });
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error('Ошибка при получении информации о команде:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о команде' },
      { status: 500 }
    );
  }
}

// Обновить информацию о команде
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    // Проверяем, существует ли команда и является ли пользователь владельцем
    const team = await prisma.team.findUnique({
      where: { 
        id,
        ownerId: session.user.id, // Только владелец может редактировать команду
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена или у вас нет прав на её редактирование' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Название команды не может быть пустым' }, { status: 400 });
    }
    
    // Обновляем данные команды
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Ошибка при обновлении команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении команды' },
      { status: 500 }
    );
  }
}

// Удалить команду
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    // Проверяем, существует ли команда и является ли пользователь владельцем
    const team = await prisma.team.findUnique({
      where: { 
        id,
        ownerId: session.user.id, // Только владелец может удалить команду
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена или у вас нет прав на её удаление' },
        { status: 404 }
      );
    }
    
    // Проверяем, не участвует ли команда в активных событиях
    const teamParticipations = await prisma.teamParticipation.findMany({
      where: { teamId: id },
      include: {
        fishingEvent: true,
      },
    });
    
    const activeEvents = teamParticipations.filter((tp: any) => 
      new Date(tp.fishingEvent.endDate || tp.fishingEvent.startDate) > new Date()
    );
    
    if (activeEvents.length > 0) {
      return NextResponse.json(
        { 
          error: 'Невозможно удалить команду, которая участвует в активных событиях',
          activeEvents: activeEvents.map((e: any) => ({
            id: e.fishingEvent.id,
            title: e.fishingEvent.title,
            startDate: e.fishingEvent.startDate,
          })),
        },
        { status: 400 }
      );
    }
    
    // Удаляем всех участников команды и команду
    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { teamId: id } }),
      prisma.teamParticipation.deleteMany({ where: { teamId: id } }),
      prisma.team.delete({ where: { id } }),
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении команды' },
      { status: 500 }
    );
  }
} 