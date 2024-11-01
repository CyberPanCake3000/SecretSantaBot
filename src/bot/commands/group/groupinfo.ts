import {Scenes, Markup, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {User} from '../../../db/models/user';

interface GroupInfoData {
  name: string;
  eventDate: Date;
  eventInfo: string;
  adminTelegramId: number;
  giftPriceRange: {
    min: number;
    max: number;
  };
  drawStatus: string;
}

// TODO: избавиться от any!! и использовать GroupInfoData
const formatGroupInfo = async (group: any) => {
  const admin = await User.findOne(
    {telegramId: group.adminTelegramId},
    {telegramUsername: 1}
  );

  const drawStatusMap: {[key: string]: string} = {
    pending: 'Ожидает начала',
    'in-progress': 'В процессе',
    completed: '✅ Завершена',
    failed: '❌ Не удалась',
  };

  const formattedDate = new Date(group.eventDate).toLocaleDateString();
  const formattedName = group.name;
  const formattedInfo = group.eventInfo || 'не указано';
  const formattedUsername = admin?.telegramUsername || 'неизвестен';
  const formattedStatus = drawStatusMap[group.drawStatus] || group.drawStatus;
  const minPrice = group.giftPriceRange.min.toString();
  const maxPrice = group.giftPriceRange.max.toString();

  return `
📅 Дата мероприятия: ${formattedDate}
📝 Название: ${formattedName}
👑 Организатор: @${formattedUsername}
ℹ️ Описание: ${formattedInfo}
💰 Ценовой диапазон: ${minPrice}- ${maxPrice} руб.
🎲 Статус жеребьевки: ${formattedStatus}`;
};

export const groupInfoWizard = new Scenes.WizardScene<SantaContext>(
  'groupinfo',
  async ctx => {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Не удалось определить пользователя');
      return ctx.scene.leave();
    }

    const userWithGroups = await User.aggregate([
      {$match: {telegramId: userId}},
      {$unwind: '$groups'},
      {
        $lookup: {
          from: 'groups',
          localField: 'groups.groupId',
          foreignField: '_id',
          as: 'groupDetails',
        },
      },
      {$unwind: '$groupDetails'},
      {
        $project: {
          _id: '$groups.groupId',
          name: '$groupDetails.name',
          eventDate: '$groupDetails.eventDate',
          eventInfo: '$groupDetails.eventInfo',
          adminTelegramId: '$groupDetails.adminTelegramId',
          giftPriceRange: '$groupDetails.giftPriceRange',
          drawStatus: '$groupDetails.drawStatus',
        },
      },
    ]);

    if (!userWithGroups || userWithGroups.length === 0) {
      await ctx.reply(
        'У вас пока нет групп. Создайте новую группу с помощью команды /create или присоединитесь к существующей через /join'
      );
      return ctx.scene.leave();
    }

    if (userWithGroups.length === 1) {
      const groupInfo = await formatGroupInfo(userWithGroups[0]);
      await ctx.reply(groupInfo);
      return ctx.scene.leave();
    }

    const keyboard = Markup.inlineKeyboard([
      ...userWithGroups.map(group => [
        Markup.button.callback(
          `${group.name}, ${new Date(group.eventDate).toLocaleDateString()}`,
          `group_info_${group._id}`
        ),
      ]),
      [Markup.button.callback('Закрыть', 'close_info')],
    ]);

    await ctx.reply(
      'Ваши группы:\n(нажмите на группу, чтобы увидеть подробную информацию)',
      keyboard
    );

    ctx.scene.session.userGroups = userWithGroups;
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'close_info') {
      await ctx.answerCbQuery();
      await ctx.reply('Просмотр информации о группе завершен');
      return ctx.scene.leave();
    }

    if (!callbackData.startsWith('group_info_')) {
      return;
    }

    const groupId = callbackData.replace('group_info_', '');
    const group = ctx.scene.session.userGroups.find(
      (g: any) => g._id.toString() === groupId
    );

    if (!group) {
      await ctx.answerCbQuery('Группа не найдена');
      return;
    }

    await ctx.answerCbQuery();

    if (ctx.callbackQuery.message) {
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    }

    const groupInfo = await formatGroupInfo(group);
    await ctx.reply(groupInfo);
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage<SantaContext>([groupInfoWizard]);

export const groupInfoCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('groupinfo', ctx => ctx.scene.enter('groupinfo'));
};
