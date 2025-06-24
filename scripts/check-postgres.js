// Скрипт для проверки подключения к PostgreSQL
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { exec } = require('child_process');

// Загрузка переменных окружения
dotenv.config();

// Получение строки подключения из переменных окружения
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Ошибка: Переменная DATABASE_URL не найдена в файле .env');
  console.error('Создайте файл .env с помощью команды: npm run setup-env');
  process.exit(1);
}

// Извлечение имени базы данных из строки подключения
const dbNameMatch = databaseUrl.match(/\/([^\/]+)$/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'неизвестно';

// Маскировка пароля для вывода
const maskedUrl = databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:****@');
console.log(`Проверка подключения к PostgreSQL: ${maskedUrl}`);
console.log(`База данных: ${dbName}`);

// Проверка, запущен ли PostgreSQL
const port = databaseUrl.match(/:(\d+)\//);
const portNumber = port ? port[1] : '5432';

console.log(`Проверка, запущен ли PostgreSQL на порту ${portNumber}...`);

exec(`netstat -an | findstr ${portNumber}`, async (error, stdout, stderr) => {
  if (error || !stdout) {
    console.error(`\nОшибка: PostgreSQL не обнаружен на порту ${portNumber}`);
    console.error('Убедитесь, что Open Server запущен и модуль PostgreSQL активирован');
    console.error('\nИнструкции:');
    console.error('1. Запустите Open Server');
    console.error('2. В трее нажмите правой кнопкой мыши на иконку Open Server');
    console.error('3. Перейдите в "Дополнительно" -> "Конфигурация" -> "Модули"');
    console.error('4. Убедитесь, что модуль PostgreSQL включен');
    console.error('5. Перезапустите Open Server');
    process.exit(1);
  }

  console.log('PostgreSQL запущен. Проверка подключения к базе данных...');

  // Создание клиента Prisma
  const prisma = new PrismaClient();

  try {
    // Проверка подключения
    await prisma.$connect();
    console.log('Подключение к PostgreSQL успешно установлено!');

    // Проверка доступа к базе данных с использованием самого простого запроса
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('\nРезультат проверки подключения:', result[0].connected === 1n ? 'Успешно' : 'Ошибка');

    console.log('\nПроверка завершена успешно!');
    console.log('Теперь вы можете запустить миграцию: npm run prisma:migrate');
  } catch (error) {
    console.error('\nОшибка подключения к PostgreSQL:');
    console.error(error.message);

    if (error.message.includes('does not exist')) {
      console.error('\nБаза данных не существует. Необходимо создать базу данных:');
      console.error(`1. Откройте pgAdmin из Open Server`);
      console.error(`2. Подключитесь к серверу PostgreSQL`);
      console.error(`3. Создайте новую базу данных с именем: ${dbName}`);
    } else if (error.message.includes('password authentication failed')) {
      console.error('\nНеверный пароль. Проверьте настройки подключения:');
      console.error('1. Проверьте пароль пользователя postgres в Open Server');
      console.error('2. Обновите пароль в файле .env');
    }

    console.error('\nДля настройки переменных окружения выполните команду:');
    console.error('npm run setup-env');
  } finally {
    await prisma.$disconnect();
  }
}); 