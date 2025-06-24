import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

// Получить команды, участвующие в событии
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    console.log(`Запрос команд для события: ${id}`);
    
    // Проверяем существование события
    const event = await prisma.fishingEvent.findUnique({
      where: { id },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    
    // Проверяем, что формат события командный
    if (event.format === 'solo') {
      return NextResponse.json({ error: 'Событие имеет сольный формат участия' }, { status: 400 });
    }
    
    // Получаем команды, участвующие в событии
    const teamParticipations = await prisma.teamParticipation.findMany({
      where: { fishingEventId: id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Преобразуем данные для фронтенда
    const teams = teamParticipations.map((tp: any) => ({
      id: tp.team.id,
      name: tp.team.name,
      description: tp.team.description,
      ownerId: tp.team.ownerId,
      notes: tp.notes,
      members: tp.team.members,
      createdAt: tp.createdAt,
    }));
    
    console.log(`Найдено ${teams.length} команд для события`);
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Ошибка при получении списка команд для события:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка команд для события' },
      { status: 500 }
    );
  }
}

// Зарегистрировать команду на событие
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    const body = await request.json();
    const { teamId, notes } = body;
    
    if (!teamId) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    console.log(`Регистрация команды ${teamId} на событие ${id}`);
    
    // Проверяем существование события
    const event = await prisma.fishingEvent.findUnique({
      where: { id },
      include: {
        teamParticipations: true,
      },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    
    // Проверяем, что формат события командный
    if (event.format === 'solo') {
      return NextResponse.json(
        { error: 'Событие имеет сольный формат участия, регистрируйтесь индивидуально' },
        { status: 400 }
      );
    }
    
    // Проверяем существование команды
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });
    
    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }
    
    // Проверяем, является ли пользователь членом команды
    const isMember = team.members.some((member: any) => member.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'Вы не являетесь членом этой команды' },
        { status: 403 }
      );
    }
    
    // Проверяем соответствие размера команды формату события
    const teamSize = team.members.length;
    const requiredSize = event.format === 'team_2' ? 2 : event.format === 'team_3' ? 3 : 0;
    
    if (teamSize !== requiredSize) {
      return NextResponse.json(
        { 
          error: `Размер команды (${teamSize} человек) не соответствует формату события (${requiredSize} человек)` 
        },
        { status: 400 }
      );
    }
    
    // Проверяем, не зарегистрирована ли команда уже
    const existingParticipation = await prisma.teamParticipation.findFirst({
      where: {
        teamId,
        fishingEventId: id,
      },
    });
    
    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Команда уже зарегистрирована на это событие' },
        { status: 400 }
      );
    }
    
    // Проверяем, не превышено ли максимальное количество команд
    if (event.maxParticipants !== null && event.teamParticipations.length >= event.maxParticipants) {
      return NextResponse.json(
        { error: 'Достигнуто максимальное количество команд' },
        { status: 400 }
      );
    }
    
    // Проверяем, не зарегистрированы ли участники команды на это событие индивидуально
    const teamMemberIds = team.members.map((member: any) => member.userId);
    
    const individualParticipants = await prisma.fishingParticipant.findMany({
      where: {
        fishingEventId: id,
        userId: { in: teamMemberIds },
      },
    });
    
    if (individualParticipants.length > 0) {
      return NextResponse.json(
        { error: 'Один или несколько участников команды уже зарегистрированы на это событие индивидуально' },
        { status: 400 }
      );
    }
    
    // Проверяем, не участвуют ли члены команды в других командах на этом событии
    const otherTeamParticipations = await prisma.teamParticipation.findMany({
      where: {
        fishingEventId: id,
      },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });
    
    const membersInOtherTeams = otherTeamParticipations.flatMap((tp: any) => 
      tp.team.members.filter((member: any) => teamMemberIds.includes(member.userId))
    );
    
    if (membersInOtherTeams.length > 0) {
      return NextResponse.json(
        { error: 'Один или несколько участников команды уже зарегистрированы на это событие в составе другой команды' },
        { status: 400 }
      );
    }
    
    // Создаем запись об участии команды
    const participation = await prisma.teamParticipation.create({
      data: {
        teamId,
        fishingEventId: id,
        notes,
      },
    });
    
    // Возвращаем данные с информацией о команде
    const result = await prisma.teamParticipation.findUnique({
      where: { id: participation.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Ошибка при регистрации команды на событие:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации команды на событие' },
      { status: 500 }
    );
  }
}

// Отменить регистрацию команды
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    const { id } = context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Не указан ID события' }, { status: 400 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json({ error: 'Не указан ID команды' }, { status: 400 });
    }
    
    console.log(`Отмена регистрации команды ${teamId} на событие ${id}`);
    
    // Проверяем, зарегистрирована ли команда на событие
    const participation = await prisma.teamParticipation.findFirst({
      where: {
        teamId,
        fishingEventId: id,
      },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });
    
    if (!participation) {
      return NextResponse.json(
        { error: 'Команда не зарегистрирована на это событие' },
        { status: 404 }
      );
    }
    
    // Проверяем, является ли пользователь членом команды
    const isMember = participation.team.members.some((member: any) => member.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'Вы не являетесь членом этой команды' },
        { status: 403 }
      );
    }
    
    // Удаляем запись об участии
    await prisma.teamParticipation.delete({
      where: { id: participation.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отмене регистрации команды:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене регистрации команды' },
      { status: 500 }
    );
  }
} 