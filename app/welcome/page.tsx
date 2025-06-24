import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Добро пожаловать в Fishdvizh</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Простой и удобный менеджер задач, который помогает организовать вашу работу
        </p>
        
        <div className="flex justify-center gap-4 mb-12">
          <Button asChild size="lg">
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">Регистрация</Link>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Управляйте задачами</h3>
            <p className="text-muted-foreground">
              Создавайте, редактируйте и отмечайте выполненные задачи в удобном интерфейсе
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Персональный доступ</h3>
            <p className="text-muted-foreground">
              Ваши задачи доступны только вам после авторизации
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Современные технологии</h3>
            <p className="text-muted-foreground">
              Приложение создано с использованием React, Next.js, Prisma, Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 