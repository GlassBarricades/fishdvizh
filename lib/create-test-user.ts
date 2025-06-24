import { hash } from 'bcrypt';
import prisma from '@/lib/db';

/**
 * Создает тестового пользователя для демонстрации
 */
export async function createTestUser() {
  try {
    // Проверяем, существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'test@example.com',
      },
    });

    if (existingUser) {
      console.log('Тестовый пользователь уже существует');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await hash('password123', 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name: 'Тестовый Пользователь',
        email: 'test@example.com',
        password: hashedPassword,
      },
    });

    console.log('Тестовый пользователь создан:', user.id);
    return user;
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
  }
} 