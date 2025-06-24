import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Функция для расчета изменения рейтинга по формуле Эло
function calculateEloRatingChange(winnerRating: number, loserRating: number, kFactor: number = 32): number {
  // Ожидаемый результат для победителя
  const expectedScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  
  // Изменение рейтинга
  return Math.round(kFactor * (1 - expectedScore));
}

// GET /api/fishing/events/[id]/results - получение результатов соревнования
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // Получаем результаты соревнования
    const results = await prisma.eventResult.findMany({
      where: {
        fishingEventId: eventId,
      },
      orderBy: {
        place: 'asc',
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching event results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/fishing/events/[id]/results - добавление результатов соревнования
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const data = await req.json();

    // Проверяем, что пользователь является организатором события
    const event = await prisma.fishingEvent.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json({ error: 'Only event organizer can add results' }, { status: 403 });
    }

    // Проверяем формат данных
    if (!Array.isArray(data.results) || data.results.length === 0) {
      return NextResponse.json({ error: 'Invalid results format' }, { status: 400 });
    }

    // Удаляем предыдущие результаты, если есть
    await prisma.eventResult.deleteMany({
      where: {
        fishingEventId: eventId,
      },
    });

    // Обрабатываем каждый результат
    const results = [];
    for (const result of data.results) {
      const { participantType, participantId, place, score } = result;

      // Проверяем корректность типа участника
      if (participantType !== 'user' && participantType !== 'team') {
        return NextResponse.json(
          { error: `Invalid participant type: ${participantType}` },
          { status: 400 }
        );
      }

      // Получаем текущий рейтинг участника
      let currentRating = 1000; // По умолчанию
      if (participantType === 'user') {
        const user = await prisma.user.findUnique({
          where: { id: participantId },
          select: { rating: true },
        });
        if (!user) {
          return NextResponse.json(
            { error: `User not found: ${participantId}` },
            { status: 404 }
          );
        }
        currentRating = user.rating;
      } else {
        const team = await prisma.team.findUnique({
          where: { id: participantId },
          select: { rating: true },
        });
        if (!team) {
          return NextResponse.json(
            { error: `Team not found: ${participantId}` },
            { status: 404 }
          );
        }
        currentRating = team.rating;
      }

      // Рассчитываем изменение рейтинга
      // Для простоты: +20 для первого места, +10 для второго, 0 для третьего, -10 для остальных
      let ratingChange = 0;
      if (place === 1) ratingChange = 20;
      else if (place === 2) ratingChange = 10;
      else if (place === 3) ratingChange = 0;
      else ratingChange = -10;

      // Создаем запись о результате
      const eventResult = await prisma.eventResult.create({
        data: {
          fishingEventId: eventId,
          participantType,
          participantId,
          place,
          score,
          ratingChange,
        },
      });
      results.push(eventResult);

      // Обновляем рейтинг участника
      const newRating = currentRating + ratingChange;
      if (participantType === 'user') {
        // Обновляем рейтинг пользователя
        await prisma.user.update({
          where: { id: participantId },
          data: { rating: newRating },
        });

        // Добавляем запись в историю рейтинга
        await prisma.userRatingHistory.create({
          data: {
            userId: participantId,
            fishingEventId: eventId,
            oldRating: currentRating,
            newRating,
            change: ratingChange,
            reason: `Место ${place} в соревновании "${event.title}"`,
          },
        });
      } else {
        // Обновляем рейтинг команды
        await prisma.team.update({
          where: { id: participantId },
          data: { rating: newRating },
        });

        // Добавляем запись в историю рейтинга
        await prisma.teamRatingHistory.create({
          data: {
            teamId: participantId,
            fishingEventId: eventId,
            oldRating: currentRating,
            newRating,
            change: ratingChange,
            reason: `Место ${place} в соревновании "${event.title}"`,
          },
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error adding event results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 