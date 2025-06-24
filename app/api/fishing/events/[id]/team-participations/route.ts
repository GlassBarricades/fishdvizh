import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить список команд, участвующих в событии
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: eventId } = context.params;
    
    if (!eventId) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Проверяем существование события
    const event = await prisma.fishingEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    
    const teamParticipations = await prisma.teamParticipation.findMany({
      where: { fishingEventId: eventId },
      include: {
        team: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json(teamParticipations);
  } catch (error) {
    console.error('Ошибка при получении списка команд-участников:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка команд-участников' },
      { status: 500 }
    );
  }
}

// Зарегистрировать команду на событие
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id: eventId } = context.params;
    
    if (!eventId) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    const body = await request.json();
    const { teamId, notes } = body;
    
    if (!teamId) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    // Проверяем существование события
    const event = await prisma.fishingEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    
    // Проверяем, является ли пользователь владельцем или администратором команды
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    if (!teamMember) {
      return NextResponse.json(
        { error: 'Вы не являетесь владельцем или администратором указанной команды' },
        { status: 403 }
      );
    }
    
    // Проверяем, не зарегистрирована ли команда уже на это событие
    const existingParticipation = await prisma.teamParticipation.findFirst({
      where: {
        teamId,
        fishingEventId: eventId,
      },
    });
    
    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Команда уже зарегистрирована на это событие' },
        { status: 400 }
      );
    }
    
    // Создаем запись об участии команды
    const teamParticipation = await prisma.teamParticipation.create({
      data: {
        teamId,
        fishingEventId: eventId,
        notes,
      },
      include: {
        team: {
          include: {
            owner: {
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
    
    return NextResponse.json(teamParticipation, { status: 201 });
  } catch (error) {
    console.error('Ошибка при регистрации команды на событие:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации команды на событие' },
      { status: 500 }
    );
  }
}

// Отменить участие команды в событии
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id: eventId } = context.params;
    
    if (!eventId) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    // Проверяем, является ли пользователь владельцем или администратором команды
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    // Проверяем, является ли пользователь организатором события
    const event = await prisma.fishingEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!teamMember && event?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Нет прав на отмену участия команды в событии' },
        { status: 403 }
      );
    }
    
    // Находим запись об участии команды
    const participation = await prisma.teamParticipation.findFirst({
      where: {
        teamId,
        fishingEventId: eventId,
      },
    });
    
    if (!participation) {
      return NextResponse.json(
        { error: 'Команда не зарегистрирована на это событие' },
        { status: 404 }
      );
    }
    
    // Удаляем запись об участии
    await prisma.teamParticipation.delete({
      where: { id: participation.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отмене участия команды в событии:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене участия команды в событии' },
      { status: 500 }
    );
  }
} 