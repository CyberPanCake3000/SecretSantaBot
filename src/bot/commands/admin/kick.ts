import {Scenes, Markup, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {Group} from '../../../db/models/group';
import {User} from '../../../db/models/user';
import {formatDateToOutput} from '../../../utils/formatDateToOutput';

export const kickWizard = new Scenes.WizardScene<SantaContext>(
  'kick',
  async ctx => {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Не удалось определить пользователя');
      return ctx.scene.leave();
    }

    const userGroups = await Group.find(
      {
        adminTelegramId: userId,
        drawStatus: {$ne: 'completed'},
      },
      {_id: 1, name: 1, eventDate: 1}
    );

    if (userGroups.length === 0) {
      await ctx.reply('У вас нет активных групп для удаления участников');
      return ctx.scene.leave();
    }

    if (userGroups.length === 1) {
      const group = userGroups[0];
      const formattedDate = formatDateToOutput(group.eventDate);

      ctx.scene.session.selectedGroupId = group._id.toString();
      ctx.scene.session.selectedGroupFullName = `${group.name}, ${formattedDate}`;

      await ctx.reply(
        `Выбрана группа "${ctx.scene.session.selectedGroupFullName}"\n\nОтправьте контакт участника, которого хотите удалить из группы\n\nДля завершения введите /cancel`
      );
      return ctx.wizard.next();
    }

    const keyboard = Markup.inlineKeyboard([
      ...userGroups.map(group => {
        const formattedDate = formatDateToOutput(group.eventDate);
        return [
          Markup.button.callback(
            `${group.name}, ${formattedDate}`,
            `kick_${group._id}`
          ),
        ];
      }),
      [Markup.button.callback('Отмена', 'cancel_kick')],
    ]);

    await ctx.reply(
      'Выберите группу, из которой хотите удалить участника:',
      keyboard
    );

    ctx.scene.session.userGroups = userGroups.map(group =>
      group._id.toString()
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const callbackData = ctx.callbackQuery.data;

      if (callbackData === 'cancel_kick') {
        await ctx.answerCbQuery();
        await ctx.reply('Удаление участников из группы прекращено');
        return ctx.scene.leave();
      }

      if (callbackData?.startsWith('kick_')) {
        const groupId = callbackData.replace('kick_', '');
        if (!ctx.scene.session.userGroups?.includes(groupId)) {
          await ctx.answerCbQuery('Группа не найдена');
          return ctx.scene.leave();
        }

        const group = await Group.findById(groupId);
        if (!group) {
          await ctx.answerCbQuery('Группа не найдена');
          return ctx.scene.leave();
        }

        if (group.drawStatus === 'completed') {
          await ctx.answerCbQuery('Нельзя удалять участников после жеребьевки');
          return ctx.scene.leave();
        }

        const formattedDate = formatDateToOutput(group.eventDate);

        ctx.scene.session.selectedGroupId = groupId;
        ctx.scene.session.selectedGroupFullName = `${group.name}, ${formattedDate}`;

        await ctx.answerCbQuery();
        await ctx.deleteMessage();
        await ctx.reply(
          `Выбрана группа "${ctx.scene.session.selectedGroupFullName}"\n\nОтправьте контакт участника, которого хотите удалить из группы\n\nДля завершения введите /cancel`
        );
        return;
      }
    }

    if (ctx.message) {
      if ('text' in ctx.message && ctx.message.text === '/cancel') {
        await ctx.reply('Операция завершена');
        return ctx.scene.leave();
      }

      let userId: number | undefined;

      if ('contact' in ctx.message && ctx.message.contact) {
        userId = ctx.message.contact.user_id;
      }

      if (!userId) {
        await ctx.reply(
          'Пожалуйста, отправьте корректный контакт пользователя или введите команду /cancel'
        );
        return;
      }

      try {
        const groupId = ctx.scene.session.selectedGroupId;
        const group = await Group.findById(groupId);

        if (!group) {
          await ctx.reply('Группа не найдена');
          return ctx.scene.leave();
        }

        const existingAllowedUser = group.allowedUsers.find(
          user => user.userTelegramId === userId
        );

        if (!existingAllowedUser) {
          await ctx.reply('Пользователь не найден в группе');
          return;
        }

        group.allowedUsers = group.allowedUsers.filter(
          user => user.userTelegramId !== userId
        );

        group.participants = group.participants.filter(
          participant => participant.userTelegramId !== userId
        );

        await group.save();

        await User.updateOne(
          {telegramId: userId},
          {$pull: {groups: {groupId: group._id}}}
        );

        await ctx.reply(
          `Пользователь успешно удален из группы "${ctx.scene.session.selectedGroupFullName}"\n\nМожете отправить следующий контакт или /cancel для завершения`
        );
      } catch (error) {
        console.error('Error removing participant:', error);
        await ctx.reply('Произошла ошибка при удалении участника');
        return ctx.scene.leave();
      }
    }
  }
);

const stage = new Scenes.Stage<SantaContext>([kickWizard]);

export const kickCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('kick', ctx => ctx.scene.enter('kick'));
};
