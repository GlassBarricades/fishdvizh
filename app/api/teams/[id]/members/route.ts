import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

// Получить список всех участников команды
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
    
    // Проверяем, существует ли команда
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
    
    // Проверяем, является ли пользователь членом команды
    const isMember = team.members.some((member: TeamMember) => member.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: 'У вас нет доступа к этой команде' }, { status: 403 });
    }
    
    // Возвращаем список участников
    return NextResponse.json(team.members);
  } catch (error) {
    console.error('Ошибка при получении списка участников команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка участников команды' },
      { status: 500 }
    );
  }
}

// Добавить нового участника в команду
export async function POST(
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
    
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Не указан email пользователя' }, { status: 400 });
    }
    
    // Проверяем, существует ли команда и является ли пользователь владельцем
    const team = await prisma.team.findUnique({
      where: {
        id,
        ownerId: session.user.id, // Только владелец может добавлять участников
      },
      include: {
        members: true,
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена или у вас нет прав на добавление участников' },
        { status: 404 }
      );
    }
    
    // Проверяем ограничения на размер команды (для команд, участвующих в событиях)
    const maxTeamSize = 3; // Максимальный размер команды (для формата team_3)
    
    if (team.members.length >= maxTeamSize) {
      return NextResponse.json(
        { error: `Превышен максимальный размер команды (${maxTeamSize} человек)` },
        { status: 400 }
      );
    }
    
    // Находим пользователя по email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с указанным email не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, не является ли пользователь уже участником команды
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: user.id,
      },
    });
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'Пользователь уже является участником команды' },
        { status: 400 }
      );
    }
    
    // Добавляем пользователя в команду
    const newMember = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: user.id,
        role: 'member',
      },
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
    });
    
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении участника в команду:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении участника в команду' },
      { status: 500 }
    );
  }
}

// Удалить участника из команды
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
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    if (!memberId) {
      return NextResponse.json({ error: 'Не указан ID участника' }, { status: 400 });
    }
    
    // Проверяем, существует ли команда и является ли пользователь владельцем
    const team = await prisma.team.findUnique({
      where: {
        id,
        ownerId: session.user.id, // Только владелец может удалять участников
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена или у вас нет прав на удаление участников' },
        { status: 404 }
      );
    }
    
    // Находим участника команды
    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: id,
      },
      include: {
        user: true,
      },
    });
    
    if (!member) {
      return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
    }
    
    // Нельзя удалить владельца команды
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Невозможно удалить владельца команды' },
        { status: 400 }
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
          error: 'Невозможно удалить участника, так как команда участвует в активных событиях',
          activeEvents: activeEvents.map((e: any) => ({
            id: e.fishingEvent.id,
            title: e.fishingEvent.title,
            startDate: e.fishingEvent.startDate,
          })),
        },
        { status: 400 }
      );
    }
    
    // Удаляем участника из команды
    await prisma.teamMember.delete({
      where: { id: memberId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении участника из команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении участника из команды' },
      { status: 500 }
    );
  }
} 