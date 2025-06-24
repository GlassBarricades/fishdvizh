import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить список участников события
export async function GET(request: NextRequest) {
  try {
    // Получаем ID события из параметров запроса
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    
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
    
    const participants = await prisma.fishingParticipant.findMany({
      where: { fishingEventId: eventId },
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
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Ошибка при получении списка участников:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка участников' },
      { status: 500 }
    );
  }
}

// Зарегистрироваться на событие
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const body = await request.json();
    const { eventId, notes } = body;
    
    if (!eventId) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Проверяем существование события
    const event = await prisma.fishingEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    
    // Проверяем формат события - должен быть сольный для индивидуальной регистрации
    if (event.format !== 'solo') {
      return NextResponse.json(
        { error: `Это командное соревнование (${event.format === 'team_2' ? '2 человека' : '3 человека'}). Регистрация возможна только командой.` },
        { status: 400 }
      );
    }
    
    // Проверяем, не зарегистрирован ли пользователь уже
    const existingParticipant = await prisma.fishingParticipant.findFirst({
      where: {
        fishingEventId: eventId,
        userId: session.user.id,
      },
    });
    
    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Вы уже зарегистрированы на это событие' },
        { status: 400 }
      );
    }
    
    // Проверяем, не превышено ли максимальное количество участников
    if (event.maxParticipants !== null && event.participants.length >= event.maxParticipants) {
      return NextResponse.json(
        { error: 'Достигнуто максимальное количество участников' },
        { status: 400 }
      );
    }
    
    // Создаем запись об участии
    const participant = await prisma.fishingParticipant.create({
      data: {
        fishingEventId: eventId,
        userId: session.user.id,
        name: session.user.name || session.user.email || 'Неизвестный участник',
        contact: session.user.email || '',
        notes,
      },
    });
    
    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Ошибка при регистрации на событие:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации на событие' },
      { status: 500 }
    );
  }
}

// Отменить регистрацию на событие
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    // Получаем ID события из параметров запроса
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    console.log(`Отмена регистрации пользователя ${session.user.id} на событие ${eventId}`);
    
    // Находим запись об участии
    const participant = await prisma.fishingParticipant.findFirst({
      where: {
        fishingEventId: eventId,
        userId: session.user.id,
      },
    });
    
    if (!participant) {
      console.log('Запись об участии не найдена');
      return NextResponse.json(
        { error: 'Вы не зарегистрированы на это событие' },
        { status: 404 }
      );
    }
    
    console.log(`Найдена запись об участии: ${participant.id}`);
    
    // Удаляем запись об участии
    await prisma.fishingParticipant.delete({
      where: { id: participant.id },
    });
    
    console.log('Запись об участии успешно удалена');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отмене регистрации:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене регистрации на событие' },
      { status: 500 }
    );
  }
} 