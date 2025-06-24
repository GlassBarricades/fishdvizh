import { TaskForm } from '@/components/tasks/task-form';
import { TaskList } from '@/components/tasks/task-list';
import { requireAuth } from '@/lib/auth-utils';

export default async function Home() {
  // Проверка авторизации на стороне сервера
  const session = await requireAuth();
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Менеджер задач</h1>
        <p className="text-gray-500 text-center">
          Привет, {session.user.name || session.user.email}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[2fr_3fr]">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Добавить задачу</h2>
          <TaskForm />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Ваши задачи</h2>
          <TaskList />
        </div>
      </div>
    </div>
  );
}
