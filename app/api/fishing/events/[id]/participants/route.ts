import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить список участников события
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Не указан ID события' }, 
        { status: 400 }
      );
    }
    
    const event = await prisma.fishingEvent.findUnique({
      where: { id },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Событие не найдено' }, 
        { status: 404 }
      );
    }
    
    const participants = await prisma.fishingParticipant.findMany({
      where: { fishingEventId: id },
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
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' }, 
        { status: 401 }
      );
    }
    
    const { id: eventId } = params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Не указан ID события' }, 
        { status: 400 }
      );
    }
    
    const event = await prisma.fishingEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Событие не найдено' }, 
        { status: 404 }
      );
    }
    
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
    
    if (event.maxParticipants !== null && 
        event.participants.length >= event.maxParticipants) {
      return NextResponse.json(
        { error: 'Достигнуто максимальное количество участников' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { notes } = body || {};
    
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' }, 
        { status: 401 }
      );
    }
    
    const { id: eventId } = params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Не указан ID события' }, 
        { status: 400 }
      );
    }
    
    const participant = await prisma.fishingParticipant.findFirst({
      where: {
        fishingEventId: eventId,
        userId: session.user.id,
      },
    });
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Вы не зарегистрированы на это событие' },
        { status: 404 }
      );
    }
    
    await prisma.fishingParticipant.delete({
      where: { id: participant.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отмене регистрации:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене регистрации на событие' },
      { status: 500 }
    );
  }
}