import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/teams/ratings - получение списка команд с рейтингом
export async function GET(req: NextRequest) {
  try {
    // Получаем параметры запроса
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Получаем общее количество команд
    const totalTeams = await prisma.team.count();

    // Получаем команды с рейтингом, отсортированных по убыванию рейтинга
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            members: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Возвращаем результат
    return NextResponse.json({
      teams,
      pagination: {
        total: totalTeams,
        page,
        limit,
        pages: Math.ceil(totalTeams / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching team ratings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 