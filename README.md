# Fishdvizh - Менеджер задач

Проект построен с использованием следующего стека технологий:

- **React** - библиотека для создания пользовательских интерфейсов
- **Next.js** - фреймворк для React с серверным рендерингом
- **TanStack Query** - библиотека для работы с серверными данными
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных (через Open Server v5)
- **shadcn/ui** - набор компонентов для React
- **Tailwind CSS** - утилитарный CSS-фреймворк

## Функциональность

- Создание, редактирование, удаление задач
- Отметка задач как выполненных
- Сохранение данных в PostgreSQL

## Начало работы

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/fishdvizh.git
cd fishdvizh
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте базу данных PostgreSQL через Open Server v5:
   - Установите и запустите Open Server v5
   - Настройте PostgreSQL согласно инструкции в [docs/open-server-setup.md](docs/open-server-setup.md)
   - Запустите интерактивный скрипт настройки окружения:
   ```bash
   npm run setup-env
   ```
   - Проверьте подключение к PostgreSQL:
   ```bash
   npm run check-postgres
   ```
   - Создайте базу данных:
   ```bash
   npm run init-postgres
   ```

4. Примените миграции к базе данных:
```bash
npm run prisma:migrate
```

5. Сгенерируйте клиент Prisma:
```bash
npm run prisma:generate
```

6. Запустите приложение:
```bash
npm run dev
```

7. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Миграция с SQLite на PostgreSQL

Если у вас уже есть данные в SQLite и вы хотите перенести их в PostgreSQL:

1. Убедитесь, что PostgreSQL запущен в Open Server
2. Проверьте подключение к PostgreSQL:
```bash
npm run check-postgres
```
3. Создайте базу данных:
```bash
npm run init-postgres
```
4. Запустите скрипт миграции:
```bash
npm run migrate-to-postgres
```

## Доступные скрипты

- `npm run dev` - запуск приложения в режиме разработки
- `npm run build` - сборка приложения
- `npm run start` - запуск собранного приложения
- `npm run lint` - проверка кода линтером
- `npm run setup-env` - интерактивная настройка переменных окружения
- `npm run check-postgres` - проверка подключения к PostgreSQL
- `npm run init-postgres` - создание базы данных PostgreSQL
- `npm run prisma:migrate` - применение миграций Prisma
- `npm run prisma:generate` - генерация клиента Prisma
- `npm run migrate-to-postgres` - миграция данных из SQLite в PostgreSQL

## Решение проблем

### Ошибка подключения к PostgreSQL

Если вы видите ошибку: `Can't reach database server at localhost:5432`

1. Убедитесь, что Open Server запущен (зеленый индикатор в трее)
2. Проверьте, что модуль PostgreSQL активирован в настройках
3. Запустите проверку подключения:
```bash
npm run check-postgres
```
4. Если проблема не решена, проверьте настройки PostgreSQL в Open Server:
   - Порт (по умолчанию 5432)
   - Пароль пользователя postgres
   - Статус сервера PostgreSQL

### Ошибка миграции

Если вы видите ошибку при миграции, связанную с несоответствием провайдера базы данных:

1. Удалите директорию миграций:
```bash
rm -r prisma/migrations
```
2. Запустите миграцию заново:
```bash
npm run prisma:migrate
```

### Дополнительная информация

Подробные инструкции по настройке PostgreSQL в Open Server доступны в файле [docs/open-server-setup.md](docs/open-server-setup.md).

## Структура проекта

- `/app` - роутинг и страницы Next.js
- `/components` - React компоненты
- `/lib` - утилиты и хуки
- `/prisma` - схема и миграции Prisma
- `/scripts` - скрипты для миграции данных
- `/docs` - документация по настройке и использованию

## Лицензия

MIT
