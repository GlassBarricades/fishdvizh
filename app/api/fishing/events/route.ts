import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить все рыболовные события
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Для простоты реализации показываем все события, даже для неавторизованных пользователей
    const events = await prisma.fishingEvent.findMany({
      orderBy: { startDate: 'desc' },
    });
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении рыболовных событий' },
      { status: 500 }
    );
  }
}

// Создать новое рыболовное событие
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('API POST /fishing/events: Сессия пользователя:', session?.user?.id || 'не авторизован');
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('API POST /fishing/events: Полученные данные:', JSON.stringify(body, null, 2));
    
    const { 
      title, 
      description, 
      latitude, 
      longitude, 
      startDate, 
      endDate, 
      fishTypes, 
      weather,
      format,
      maxParticipants
    } = body;
    
    console.log('API POST /fishing/events: Формат соревнования:', format);
    
    // Проверка обязательных полей
    if (!title || !startDate || latitude === undefined || longitude === undefined) {
      console.log('API POST /fishing/events: Отсутствуют обязательные поля');
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }
    
    // Проверка формата соревнования
    const validFormats = ['solo', 'team_2', 'team_3'];
    const eventFormat = format || 'solo';
    
    if (!validFormats.includes(eventFormat)) {
      console.log('API POST /fishing/events: Некорректный формат соревнования:', eventFormat);
      return NextResponse.json(
        { error: 'Некорректный формат соревнования' },
        { status: 400 }
      );
    }
    
    // Подготовка данных для создания события
    const eventData = {
      title,
      description,
      latitude,
      longitude,
      startDate,
      endDate,
      fishTypes,
      weather,
      format: eventFormat,
      maxParticipants: maxParticipants !== undefined ? maxParticipants : null,
      userId: session.user.id,
    };
    
    console.log('API POST /fishing/events: Данные для создания события:', JSON.stringify(eventData, null, 2));
    
    // Создаем новое событие
    try {
      const event = await prisma.fishingEvent.create({
        data: eventData,
      });
      
      console.log('API POST /fishing/events: Событие успешно создано, ID:', event.id, 'Формат:', event.format);
      return NextResponse.json(event, { status: 201 });
    } catch (dbError) {
      console.error('API POST /fishing/events: Ошибка базы данных при создании:', dbError);
      return NextResponse.json(
        { error: 'Ошибка базы данных при создании события' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании рыболовного события' },
      { status: 500 }
    );
  }
} 