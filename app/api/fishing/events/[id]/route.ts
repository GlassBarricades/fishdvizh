import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить данные о конкретном рыболовном событии
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    console.log('API GET /fishing/events/[id]: Сессия пользователя:', session?.user?.id || 'не авторизован');
    
    // Правильное асинхронное получение ID
    const { id } = context.params;
    console.log('API GET /fishing/events/[id]: Запрошенный ID события:', id);
    
    // Проверяем, что ID не пустой
    if (!id) {
      console.log('API GET /fishing/events/[id]: ID события не указан');
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Проверяем, что ID не является строкой "events" (ошибка маршрутизации)
    if (id === 'events') {
      console.log('API GET /fishing/events/[id]: Некорректный ID события (events)');
      return NextResponse.json({ error: 'Некорректный ID события' }, { status: 400 });
    }
    
    // Проверяем, что ID имеет правильный формат (например, для CUID)
    if (!/^[a-z0-9]+$/i.test(id)) {
      console.log('API GET /fishing/events/[id]: Некорректный формат ID');
      return NextResponse.json({ error: 'Некорректный формат ID события' }, { status: 400 });
    }
    
    try {
      const event = await prisma.fishingEvent.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: true,
          catches: true,
        },
      });
      
      if (!event) {
        console.log('API GET /fishing/events/[id]: Событие не найдено');
        return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
      }
      
      console.log('API GET /fishing/events/[id]: Событие найдено:', event.id, event.title);
      return NextResponse.json(event);
    } catch (dbError) {
      console.error('Ошибка базы данных при поиске события:', dbError);
      return NextResponse.json({ error: 'Ошибка базы данных при поиске события' }, { status: 500 });
    }
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных о рыболовном событии' },
      { status: 500 }
    );
  }
}

// Обновить рыболовное событие
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    console.log('API PATCH /fishing/events/[id]: Сессия пользователя:', session?.user?.id || 'не авторизован');
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    console.log('API PATCH /fishing/events/[id]: ID события для обновления:', id);
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Проверяем, принадлежит ли событие пользователю
    const existingEvent = await prisma.fishingEvent.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingEvent) {
      console.log('API PATCH /fishing/events/[id]: Событие не найдено или нет прав на редактирование');
      return NextResponse.json({ error: 'Событие не найдено или нет прав на редактирование' }, { status: 404 });
    }
    
    console.log('API PATCH /fishing/events/[id]: Текущий формат события:', existingEvent.format);
    
    const body = await request.json();
    console.log('API PATCH /fishing/events/[id]: Полученные данные:', JSON.stringify(body, null, 2));
    
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
    
    console.log('API PATCH /fishing/events/[id]: Новый формат события:', format);
    
    // Проверка формата соревнования
    const validFormats = ['solo', 'team_2', 'team_3'];
    if (format !== undefined && !validFormats.includes(format)) {
      console.log('API PATCH /fishing/events/[id]: Некорректный формат соревнования:', format);
      return NextResponse.json(
        { error: 'Некорректный формат соревнования' },
        { status: 400 }
      );
    }
    
    // Подготовка данных для обновления
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (fishTypes !== undefined) updateData.fishTypes = fishTypes;
    if (weather !== undefined) updateData.weather = weather;
    if (format !== undefined) updateData.format = format;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    
    console.log('API PATCH /fishing/events/[id]: Данные для обновления:', JSON.stringify(updateData, null, 2));
    
    try {
      const event = await prisma.fishingEvent.update({
        where: { id },
        data: updateData,
      });
      
      console.log('API PATCH /fishing/events/[id]: Событие успешно обновлено, новый формат:', event.format);
      return NextResponse.json(event);
    } catch (dbError) {
      console.error('API PATCH /fishing/events/[id]: Ошибка базы данных при обновлении:', dbError);
      return NextResponse.json(
        { error: 'Ошибка базы данных при обновлении события' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении рыболовного события' },
      { status: 500 }
    );
  }
}

// Удалить рыболовное событие
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
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    // Проверяем, принадлежит ли событие пользователю
    const existingEvent = await prisma.fishingEvent.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Событие не найдено или нет прав на удаление' }, { status: 404 });
    }
    
    await prisma.fishingEvent.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении рыболовного события' },
      { status: 500 }
    );
  }
} 