// Скрипт для миграции данных из SQLite в PostgreSQL (Open Server)
const { PrismaClient: PrismaSQLite } = require('@prisma/client');
const { PrismaClient: PrismaPostgres } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Путь к файлу SQLite
const sqliteDbPath = path.join(__dirname, '../prisma/dev.db');

// Проверка существования файла SQLite
if (!fs.existsSync(sqliteDbPath)) {
  console.error('SQLite database file not found:', sqliteDbPath);
  process.exit(1);
}

// Создаем клиент для SQLite с прямым подключением к файлу
const sqliteClient = new PrismaSQLite({
  datasources: {
    db: {
      url: `file:${sqliteDbPath}`
    }
  }
});

// Создаем клиент для PostgreSQL с использованием переменной окружения
// или с явным указанием параметров подключения для Open Server
const postgresUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/fishdvizh';
const postgresClient = new PrismaPostgres({
  datasources: {
    db: {
      url: postgresUrl
    }
  }
});

console.log('Connecting to PostgreSQL using:', postgresUrl.replace(/\/\/([^:]+):[^@]+@/, '//\\1:****@'));

async function migrateData() {
  try {
    console.log('Starting migration from SQLite to PostgreSQL (Open Server)...');

    // Проверяем подключение к PostgreSQL
    console.log('Testing PostgreSQL connection...');
    try {
      await postgresClient.$queryRaw`SELECT 1`;
      console.log('PostgreSQL connection successful!');
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err);
      console.error('Please make sure Open Server is running and PostgreSQL module is active.');
      process.exit(1);
    }

    // Миграция пользователей
    console.log('Migrating users...');
    const users = await sqliteClient.user.findMany();
    for (const user of users) {
      await postgresClient.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          password: user.password,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // Миграция аккаунтов
    console.log('Migrating accounts...');
    const accounts = await sqliteClient.account.findMany();
    for (const account of accounts) {
      await postgresClient.account.create({
        data: account
      });
    }

    // Миграция сессий
    console.log('Migrating sessions...');
    const sessions = await sqliteClient.session.findMany();
    for (const session of sessions) {
      await postgresClient.session.create({
        data: session
      });
    }

    // Миграция токенов верификации
    console.log('Migrating verification tokens...');
    const verificationTokens = await sqliteClient.verificationToken.findMany();
    for (const token of verificationTokens) {
      await postgresClient.verificationToken.create({
        data: token
      });
    }

    // Миграция задач
    console.log('Migrating tasks...');
    const tasks = await sqliteClient.task.findMany();
    for (const task of tasks) {
      await postgresClient.task.create({
        data: task
      });
    }

    // Миграция событий рыбалки
    console.log('Migrating fishing events...');
    const fishingEvents = await sqliteClient.fishingEvent.findMany();
    for (const event of fishingEvents) {
      await postgresClient.fishingEvent.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          latitude: event.latitude,
          longitude: event.longitude,
          startDate: event.startDate,
          endDate: event.endDate,
          fishTypes: event.fishTypes,
          weather: event.weather,
          format: event.format,
          maxParticipants: event.maxParticipants,
          userId: event.userId,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        }
      });
    }

    // Миграция участников рыбалки
    console.log('Migrating fishing participants...');
    const fishingParticipants = await sqliteClient.fishingParticipant.findMany();
    for (const participant of fishingParticipants) {
      await postgresClient.fishingParticipant.create({
        data: participant
      });
    }

    // Миграция уловов
    console.log('Migrating fish catches...');
    const fishCatches = await sqliteClient.fishCatch.findMany();
    for (const fishCatch of fishCatches) {
      await postgresClient.fishCatch.create({
        data: fishCatch
      });
    }

    // Миграция команд
    console.log('Migrating teams...');
    const teams = await sqliteClient.team.findMany();
    for (const team of teams) {
      await postgresClient.team.create({
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          logo: team.logo,
          ownerId: team.ownerId,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt
        }
      });
    }

    // Миграция участников команд
    console.log('Migrating team members...');
    const teamMembers = await sqliteClient.teamMember.findMany();
    for (const member of teamMembers) {
      await postgresClient.teamMember.create({
        data: member
      });
    }

    // Миграция участия команд в событиях
    console.log('Migrating team participations...');
    const teamParticipations = await sqliteClient.teamParticipation.findMany();
    for (const participation of teamParticipations) {
      await postgresClient.teamParticipation.create({
        data: participation
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

migrateData(); 