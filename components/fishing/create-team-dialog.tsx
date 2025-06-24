'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Схема валидации для формы создания команды
const teamSchema = z.object({
  name: z.string().min(2, {
    message: 'Название команды должно содержать минимум 2 символа',
  }).max(50, {
    message: 'Название команды не должно превышать 50 символов',
  }),
  description: z.string().max(500, {
    message: 'Описание не должно превышать 500 символов',
  }).optional(),
  logo: z.string().url({
    message: 'Введите корректный URL изображения',
  }).optional().or(z.literal('')),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamFormValues) => void;
}

export function CreateTeamDialog({ open, onOpenChange, onSubmit }: CreateTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Инициализация формы с использованием react-hook-form и zod
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      logo: '',
    },
  });
  
  // Обработчик отправки формы
  const handleSubmit = async (data: TeamFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать новую команду</DialogTitle>
          <DialogDescription>
            Создайте команду для участия в рыболовных событиях вместе с друзьями.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название команды*</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название команды" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Расскажите о вашей команде (необязательно)" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Логотип команды</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="URL изображения (необязательно)" 
                      type="url" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Создание...' : 'Создать команду'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 