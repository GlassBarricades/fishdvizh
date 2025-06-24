import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Получить все задачи
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при получении задач' }, { status: 500 });
  }
}

// Создать новую задачу
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, description } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 });
    }
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при создании задачи' }, { status: 500 });
  }
} 