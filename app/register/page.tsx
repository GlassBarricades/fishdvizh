import { RegisterForm } from '@/components/auth/register-form';
import { requireGuest } from '@/lib/auth-utils';

export default async function RegisterPage() {
  // Проверяем, что пользователь не авторизован
  await requireGuest();
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Fishdvizh</h1>
        <RegisterForm />
      </div>
    </div>
  );
} 