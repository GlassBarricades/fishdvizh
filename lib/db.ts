import { PrismaClient } from '@prisma/client';

// Предотвращаем создание нескольких экземпляров PrismaClient в режиме разработки
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Настройка подключения к PostgreSQL через Open Server
export const prisma = globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Обработка ошибок подключения
prisma.$connect()
  .then(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Successfully connected to PostgreSQL database via Open Server');
    }
  })
  .catch((e) => {
    console.error('Error connecting to PostgreSQL database:', e);
    console.error('Please make sure Open Server is running and PostgreSQL module is active');
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 