'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Calendar, Home, LogIn, LogOut, Menu, User, Users, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Для страниц аутентификации навбар не отображаем
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isAuthPage = isLoginPage || isRegisterPage;
  
  if (isAuthPage) {
    return null;
  }
  
  // Простой навбар на стороне сервера или при инициализации
  if (!mounted) {
    return (
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-center">
          <div className="text-xl font-bold">Fishdvizh</div>
        </div>
      </header>
    );
  }
  
  // Если загрузка сессии не завершена, показываем временный навбар
  if (status === 'loading') {
    return (
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-center">
          <Link href="/" className="text-xl font-bold">
            Fishdvizh
          </Link>
        </div>
      </header>
    );
  }
  
  // Для авторизованных пользователей показываем полный навбар
  if (status === 'authenticated' && session?.user) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <nav className="container flex h-16 items-center justify-center">
          <div className="flex items-center justify-between w-full max-w-4xl">
            <div className="flex items-center gap-2 md:gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Toggle Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pr-0">
                  <MobileNav />
                </SheetContent>
              </Sheet>
              <Link href="/" className="hidden md:block">
                <div className="font-bold">Fishdvizh</div>
              </Link>
            </div>

            <div className="hidden gap-2 md:flex">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="mr-2 h-4 w-4" />
                  Главная
                </Button>
              </Link>
              <Link href="/fishing/events">
                <Button variant="ghost" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  События
                </Button>
              </Link>
              <Link href="/teams">
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Команды
                </Button>
              </Link>
              <Link href="/ratings">
                <Button variant="ghost" size="sm">
                  <Trophy className="mr-2 h-4 w-4" />
                  Рейтинги
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{session.user.name || session.user.email}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </div>
          </div>
        </nav>
      </header>
    );
  }
  
  // Для неавторизованных пользователей показываем навбар с кнопками входа
  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4 flex items-center justify-center">
        <div className="flex items-center justify-between w-full max-w-4xl">
          <Link href="/" className="text-xl font-bold">
            Fishdvizh
          </Link>
          
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Войти</Link>
            </Button>
            
            <Button asChild size="sm">
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-4 py-4">
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
      >
        <Home className="h-5 w-5" />
        <span className="font-medium">Главная</span>
      </Link>
      <Link
        href="/fishing/events"
        className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
      >
        <Calendar className="h-5 w-5" />
        <span className="font-medium">События</span>
      </Link>
      <Link
        href="/teams"
        className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
      >
        <Users className="h-5 w-5" />
        <span className="font-medium">Команды</span>
      </Link>
      <Link
        href="/ratings"
        className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
      >
        <Trophy className="h-5 w-5" />
        <span className="font-medium">Рейтинги</span>
      </Link>
    </div>
  );
} 