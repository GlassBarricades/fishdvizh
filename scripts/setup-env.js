// Скрипт для настройки переменных окружения
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Путь к файлу .env
const envPath = path.join(__dirname, '../.env');

// Генерация случайного секретного ключа
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Проверка существования файла .env
const envExists = fs.existsSync(envPath);

console.log('Настройка переменных окружения для подключения к PostgreSQL через Open Server');
console.log('-------------------------------------------------------------------');

// Значения по умолчанию
const defaultValues = {
  dbUser: 'postgres',
  dbPassword: 'postgres', // Стандартный пароль в Open Server
  dbHost: 'localhost',
  dbPort: '5432',
  dbName: 'fishdvizh',
  nextAuthUrl: 'http://localhost:3000'
};

// Функция для запроса значения с значением по умолчанию
const askQuestion = (question, defaultValue) => {
  return new Promise((resolve) => {
    rl.question(`${question} (по умолчанию: ${defaultValue}): `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
};

// Проверка, запущен ли PostgreSQL
const checkPostgresRunning = (port) => {
  return new Promise((resolve) => {
    exec(`netstat -an | findstr ${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.log(`\nВНИМАНИЕ: PostgreSQL не обнаружен на порту ${port}`);
        console.log('Убедитесь, что Open Server запущен и модуль PostgreSQL активирован');
        resolve(false);
      } else {
        console.log(`\nPostgreSQL обнаружен на порту ${port}`);
        resolve(true);
      }
    });
  });
};

async function setupEnv() {
  console.log('Настройка подключения к PostgreSQL:');
  
  const dbUser = await askQuestion('Имя пользователя PostgreSQL', defaultValues.dbUser);
  const dbPassword = await askQuestion('Пароль PostgreSQL', defaultValues.dbPassword);
  const dbHost = await askQuestion('Хост PostgreSQL', defaultValues.dbHost);
  const dbPort = await askQuestion('Порт PostgreSQL', defaultValues.dbPort);
  const dbName = await askQuestion('Имя базы данных', defaultValues.dbName);
  
  // Проверяем, запущен ли PostgreSQL
  await checkPostgresRunning(dbPort);
  
  console.log('\nНастройка Next.js:');
  const nextAuthUrl = await askQuestion('URL для Next Auth', defaultValues.nextAuthUrl);
  
  // Генерация секретного ключа
  const nextAuthSecret = generateSecret();
  
  // Формирование строки подключения к базе данных
  const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  
  // Создание содержимого файла .env
  const envContent = `DATABASE_URL="${databaseUrl}"
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="${nextAuthUrl}"`;
  
  // Запись в файл .env
  fs.writeFileSync(envPath, envContent);
  
  console.log('\nФайл .env успешно создан!');
  console.log(`Путь к файлу: ${envPath}`);
  console.log('\nНастройки подключения к базе данных:');
  console.log(`- Пользователь: ${dbUser}`);
  console.log(`- Пароль: ${'*'.repeat(dbPassword.length)}`);
  console.log(`- Хост: ${dbHost}`);
  console.log(`- Порт: ${dbPort}`);
  console.log(`- База данных: ${dbName}`);
  
  console.log('\nПроверка подключения к базе данных:');
  console.log('1. Убедитесь, что Open Server запущен');
  console.log('2. Убедитесь, что модуль PostgreSQL активирован');
  console.log('3. Проверьте настройки PostgreSQL в Open Server');
  
  rl.close();
}

// Предупреждение, если файл .env уже существует
if (envExists) {
  rl.question('Файл .env уже существует. Перезаписать? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      setupEnv();
    } else {
      console.log('Операция отменена.');
      rl.close();
    }
  });
} else {
  setupEnv();
}

rl.on('close', () => {
  console.log('\nНастройка завершена. Теперь вы можете запустить миграцию базы данных:');
  console.log('npm run prisma:migrate');
}); 