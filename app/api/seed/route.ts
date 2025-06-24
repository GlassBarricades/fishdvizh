import { NextResponse } from 'next/server';
import { createTestUser } from '@/lib/create-test-user';

// Этот эндпоинт создает тестового пользователя
// Только для разработки и демонстрации!
export async function GET() {
  try {
    // Проверяем, что мы в режиме разработки
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Этот эндпоинт доступен только в режиме разработки' },
        { status: 403 }
      );
    }
    
    const user = await createTestUser();
    
    return NextResponse.json({
      success: true,
      message: 'Тестовый пользователь создан',
      email: 'test@example.com',
      password: 'password123',
    });
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании тестового пользователя' },
      { status: 500 }
    );
  }
} 