'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Если статус загрузки сессии завершен и пользователь не авторизован
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);
  
  // Пока проверяем статус авторизации, показываем загрузку
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  // Если авторизован, показываем содержимое
  if (status === 'authenticated') {
    return <>{children}</>;
  }
  
  // По умолчанию возвращаем пустой фрагмент (во время редиректа)
  return null;
} 