import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Получить задачу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
    }
    
    const task = await prisma.task.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при получении задачи' }, { status: 500 });
  }
}

// Обновить задачу
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
    }
    
    // Проверяем, принадлежит ли задача пользователю
    const existingTask = await prisma.task.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }
    
    const body = await request.json();
    const { title, description, completed } = body;
    
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed }),
      },
    });
    
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при обновлении задачи' }, { status: 500 });
  }
}

// Удалить задачу
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
    }
    
    // Проверяем, принадлежит ли задача пользователю
    const existingTask = await prisma.task.findUnique({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }
    
    await prisma.task.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при удалении задачи' }, { status: 500 });
  }
} 