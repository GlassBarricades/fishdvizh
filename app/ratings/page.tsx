'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRatingsTable } from '@/components/fishing/user-ratings-table';
import { TeamRatingsTable } from '@/components/fishing/team-ratings-table';
import { Shell } from '@/components/shell';

export default function RatingsPage() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <Shell>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Рейтинги</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="players">Игроки</TabsTrigger>
            <TabsTrigger value="teams">Команды</TabsTrigger>
          </TabsList>
          
          <TabsContent value="players">
            <UserRatingsTable />
          </TabsContent>
          
          <TabsContent value="teams">
            <TeamRatingsTable />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 bg-blue-50 p-4 rounded-md text-sm text-blue-700">
          <h3 className="font-semibold mb-2">Как рассчитывается рейтинг?</h3>
          <p>
            Рейтинг участников и команд рассчитывается на основе результатов соревнований. 
            Каждый игрок и команда начинают с 1000 очков рейтинга. Рейтинг повышается за победы 
            и снижается за поражения. Чем выше рейтинг соперника, тем больше очков вы получаете за победу.
          </p>
        </div>
      </div>
    </Shell>
  );
} 