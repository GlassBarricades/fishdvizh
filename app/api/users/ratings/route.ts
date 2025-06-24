import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/users/ratings - получение списка пользователей с рейтингом
export async function GET(req: NextRequest) {
  try {
    // Получаем параметры запроса
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Получаем общее количество пользователей
    const totalUsers = await prisma.user.count();

    // Получаем пользователей с рейтингом, отсортированных по убыванию рейтинга
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Возвращаем результат
    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 