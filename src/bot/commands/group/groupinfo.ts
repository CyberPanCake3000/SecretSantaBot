import {Scenes, Markup, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {Group} from '../../../db/models/group';
import {User} from '../../../db/models/user';

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
        },
      },
    ]);

    if (!userWithGroups || userWithGroups.length === 0) {
      await ctx.reply(
        'У вас пока нет групп. Создайте новую группу с помощью команды /create или присоединитесь к существующей через /join'
      );
      return ctx.scene.leave();
    }

    //если группа одна, то сразу выводить информацию о ней
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

    await ctx.deleteMessage();

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'close_info') {
      await ctx.reply('Вы выбрали не просматривать информацию о группе');
      return ctx.scene.leave();
    }
  }
);

const stage = new Scenes.Stage<SantaContext>([groupInfoWizard]);

export const groupInfoCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('groupinfo', ctx => ctx.scene.enter('groupinfo'));
};
