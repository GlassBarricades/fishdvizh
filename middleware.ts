import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Функция для предотвращения циклических перенаправлений
export function middleware(request: NextRequest) {
  // Проверяем все возможные имена cookie сессии
  const sessionCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.session-token',
    // Для локальной разработки
    'next-auth.session-token.0',
    'next-auth.session-token.1'
  ];
  
  // Проверяем наличие хотя бы одной cookie
  let isLoggedIn = false;
  for (const cookieName of sessionCookies) {
    const cookie = request.cookies.get(cookieName);
    if (cookie?.value) {
      isLoggedIn = true;
      break;
    }
  }
  
  // Публичные маршруты
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isWelcomePage = request.nextUrl.pathname === '/welcome';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticAsset = request.nextUrl.pathname.match(/\.(jpg|jpeg|png|svg|ico|css|js)$/) || 
                      request.nextUrl.pathname.startsWith('/_next');
  
  // Исключаем страницы рыбалки из защищенных маршрутов для доступа к деталям событий
  const isFishingPage = request.nextUrl.pathname.startsWith('/fishing');
  
  // Проверяем, не является ли URL страницей события с некорректным ID
  const fishingEventMatch = request.nextUrl.pathname.match(/^\/fishing\/([^\/]+)$/);
  if (fishingEventMatch && fishingEventMatch[1] === 'events') {
    // Если URL содержит /fishing/events, перенаправляем на карту
    console.log('Middleware: Обнаружен некорректный ID события (events) в URL, перенаправление на карту');
    return NextResponse.redirect(new URL('/fishing/map', request.url));
  }
  
  // Исключаем страницы команд из защищенных маршрутов
  const isTeamsPage = request.nextUrl.pathname.startsWith('/teams');
  
  // Исключаем страницу рейтингов из защищенных маршрутов
  const isRatingsPage = request.nextUrl.pathname.startsWith('/ratings');
  
  // Проверяем наличие header от предыдущего перенаправления для предотвращения циклов
  const hasRedirectHistory = request.headers.has('x-middleware-redirect');
  
  // Логирование для отладки
  console.log(`Path: ${request.nextUrl.pathname}, LoggedIn: ${isLoggedIn}, Redirect History: ${hasRedirectHistory}`);
  
  // Если мы уже перенаправляли и это welcome или главная страница - пропускаем дальнейшие перенаправления
  if (hasRedirectHistory && (isWelcomePage || request.nextUrl.pathname === '/')) {
    return NextResponse.next();
  }
  
  // Если пользователь авторизован и пытается перейти на страницу аутентификации или приветствия
  if (isLoggedIn && (isAuthRoute || isWelcomePage)) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('x-middleware-redirect', '1');
    return response;
  }
  
  // Если пользователь не авторизован и пытается перейти на основную страницу
  if (!isLoggedIn && request.nextUrl.pathname === '/') {
    const response = NextResponse.redirect(new URL('/welcome', request.url));
    response.headers.set('x-middleware-redirect', '1');
    return response;
  }
  
  // Если пользователь не авторизован и пытается перейти на защищенный маршрут 
  // (исключаем страницы рыбалки, команд и рейтингов)
  if (!isLoggedIn && !isAuthRoute && !isWelcomePage && !isApiRoute && !isStaticAsset && !isFishingPage && !isTeamsPage && !isRatingsPage) {
    const response = NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(request.nextUrl.pathname), request.url));
    response.headers.set('x-middleware-redirect', '1');
    return response;
  }
  
  return NextResponse.next();
}

// Применяем middleware ко всем маршрутам, кроме статических файлов
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 