import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить команды пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    // Получаем ID пользователя из параметров запроса
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session.user.id;
    
    console.log(`Запрос команд пользователя: ${userId}`);
    
    // Получаем команды, где пользователь является владельцем или участником
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
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
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Найдено ${teams.length} команд пользователя`);
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Ошибка при получении списка команд:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка команд' },
      { status: 500 }
    );
  }
}

// Создать новую команду
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description, memberIds } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Не указано название команды' }, { status: 400 });
    }
    
    // Создаем новую команду
    const team = await prisma.team.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
      },
    });
    
    // Добавляем владельца как участника команды
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: 'owner',
      },
    });
    
    // Добавляем других участников, если они указаны
    if (memberIds && memberIds.length > 0) {
      const members = memberIds.map((userId: string) => ({
        teamId: team.id,
        userId,
        role: 'member',
      }));
      
      await prisma.teamMember.createMany({
        data: members,
      });
    }
    
    // Возвращаем созданную команду с участниками
    const createdTeam = await prisma.team.findUnique({
      where: { id: team.id },
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
    
    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании команды' },
      { status: 500 }
    );
  }
} 