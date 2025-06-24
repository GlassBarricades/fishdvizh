import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// Функция для проверки авторизации на стороне сервера
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session;
}

// Функция для проверки роли гостя (для страниц входа/регистрации)
export async function requireGuest() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/');
  }
} 