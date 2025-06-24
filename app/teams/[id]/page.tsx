import { TeamDetails } from '@/components/fishing/team-details';
import { Shell } from '@/components/shell';
import { requireAuth } from '@/lib/auth-utils';

export const metadata = {
  title: 'Информация о команде | Fishdvizh',
  description: 'Подробная информация о команде рыболовов',
};

export default async function TeamDetailsPage({ params }: { params: { id: string } }) {
  // Проверка авторизации на стороне сервера
  await requireAuth();
  
  return (
    <Shell>
      <div className="container py-6">
        <TeamDetails teamId={params.id} />
      </div>
    </Shell>
  );
} 