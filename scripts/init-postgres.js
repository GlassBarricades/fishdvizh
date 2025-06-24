// Скрипт для инициализации базы данных PostgreSQL
const { Client } = require('pg');
const dotenv = require('dotenv');
const readline = require('readline');
const url = require('url');

// Загрузка переменных окружения
dotenv.config();

// Получение строки подключения из переменных окружения
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Ошибка: Переменная DATABASE_URL не найдена в файле .env');
  console.error('Создайте файл .env с помощью команды: npm run setup-env');
  process.exit(1);
}

// Парсинг строки подключения
function parseConnectionString(connectionString) {
  try {
    // Удаление кавычек из строки подключения, если они есть
    const cleanUrl = connectionString.replace(/^"|"$/g, '');
    
    // Парсинг URL
    const parsedUrl = new URL(cleanUrl);
    
    // Извлечение параметров
    const user = parsedUrl.username;
    const password = parsedUrl.password;
    const host = parsedUrl.hostname;
    const port = parsedUrl.port;
    const dbName = parsedUrl.pathname.substring(1); // Убираем начальный слэш
    
    return { user, password, host, port, dbName };
  } catch (error) {
    console.error('Ошибка при парсинге строки подключения:', error.message);
    console.error('Пример правильного формата: postgresql://postgres:password@localhost:5432/fishdvizh');
    process.exit(1);
  }
}

// Получение параметров подключения
const { user, password, host, port, dbName } = parseConnectionString(databaseUrl);

console.log(`Инициализация базы данных PostgreSQL:`);
console.log(`- Хост: ${host}`);
console.log(`- Порт: ${port}`);
console.log(`- Пользователь: ${user}`);
console.log(`- База данных: ${dbName}`);

// Создание клиента PostgreSQL для подключения к серверу (без указания базы данных)
const client = new Client({
  user,
  password,
  host,
  port,
  database: 'postgres' // Подключаемся к системной базе данных postgres
});

// Функция для создания базы данных
async function createDatabase() {
  try {
    // Подключение к серверу PostgreSQL
    await client.connect();
    console.log('Подключение к PostgreSQL успешно установлено!');

    // Проверка существования базы данных
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);

    if (checkResult.rows.length > 0) {
      console.log(`База данных "${dbName}" уже существует.`);
    } else {
      // Создание базы данных
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`База данных "${dbName}" успешно создана!`);
    }

    console.log('\nБаза данных готова к использованию.');
    console.log('Теперь вы можете запустить миграцию: npm run prisma:migrate');
  } catch (error) {
    console.error('\nОшибка при инициализации базы данных:');
    console.error(error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('\nНеверный пароль. Проверьте настройки подключения:');
      console.error('1. Проверьте пароль пользователя postgres в Open Server');
      console.error('2. Обновите пароль в файле .env');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\nНе удалось подключиться к серверу PostgreSQL:');
      console.error('1. Убедитесь, что Open Server запущен');
      console.error('2. Проверьте, что модуль PostgreSQL активирован');
      console.error('3. Проверьте порт PostgreSQL в настройках Open Server');
    } else if (error.message.includes('role') && error.message.includes('does not exist')) {
      console.error('\nПользователь PostgreSQL не существует:');
      console.error('1. Проверьте имя пользователя в файле .env');
      console.error('2. Обычно в Open Server используется пользователь "postgres"');
      console.error('3. Запустите команду npm run setup-env для настройки переменных окружения');
    }
  } finally {
    await client.end();
  }
}

createDatabase(); 