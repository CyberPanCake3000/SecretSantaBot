import {Scenes, Markup, Telegraf} from 'telegraf';
import {Group} from '../../../db/models/group';
import {SantaContext} from '../../../types';
import {formatDateToOutput} from '../../../utils/formatDateToOutput';

export const addParticipantsWizard = new Scenes.WizardScene<SantaContext>(
  'addparticipants',
  async ctx => {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Не удалось определить пользователя');
      return ctx.scene.leave();
    }

    const userGroups = await Group.find(
      {adminTelegramId: userId},
      {_id: 1, name: 1, eventDate: 1}
    );

    if (userGroups.length === 0) {
      await ctx.reply('У вас нет активных групп для редактирования');
      return ctx.scene.leave();
    }

    if (userGroups.length === 1) {
      const group = userGroups[0];
      const formattedDate = new Date(group.eventDate);

      ctx.scene.session.selectedGroupId = group._id.toString();
      ctx.scene.session.selectedGroupFullName = `${group.name}, ${formattedDate}`;

      await ctx.reply(
        `Вы добавляете участников в группу "${ctx.scene.session.selectedGroupFullName}"\n\nОтправьте мне контакт нового участника\n\nДля завершения введите /cancel`
      );
      return ctx.wizard.next();
    }

    const keyboard = Markup.inlineKeyboard([
      ...userGroups.map(group => {
        const formattedDate = formatDateToOutput(group.eventDate);

        return [
          Markup.button.callback(
            `${group.name}, ${formattedDate}`,
            `add_participants_${group._id}`
          ),
        ];
      }),
      [Markup.button.callback('Отмена', 'cancel_add')],
    ]);

    await ctx.reply(
      'Выберите группу, в которую желаете добавить участников:',
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

      if (callbackData === 'cancel_add') {
        await ctx.answerCbQuery();
        await ctx.reply('Добавление участников в группу отменено');
        return ctx.scene.leave();
      }

      if (callbackData?.startsWith('add_participants_')) {
        const groupId = callbackData.replace('add_participants_', '');
        if (!ctx.scene.session.userGroups?.includes(groupId)) {
          await ctx.answerCbQuery('Группа не найдена');
          return ctx.scene.leave();
        }

        const group = await Group.findById(groupId);
        if (!group) {
          await ctx.answerCbQuery('Группа не найдена');
          return ctx.scene.leave();
        }

        const formattedDate = formatDateToOutput(group.eventDate);

        ctx.scene.session.selectedGroupId = groupId;
        ctx.scene.session.selectedGroupFullName = `${group.name}, ${formattedDate}`;

        await ctx.answerCbQuery();
        await ctx.deleteMessage();
        await ctx.reply(
          `Вы добавляете участников в группу "${ctx.scene.session.selectedGroupFullName}"\n\nОтправьте мне контакт нового участника\n\nДля завершения введите /cancel`
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

        const existingUser = group.allowedUsers.find(
          user => user.userTelegramId === userId
        );

        if (existingUser) {
          await ctx.reply('Пользователь уже добавлен в группу');
          return;
        }

        group.allowedUsers.push({
          userTelegramId: userId,
          status: 'pending',
          invitedAt: new Date(),
        });

        await group.save();
        await ctx.reply(
          `Пользователь успешно добавлен в группу "${ctx.scene.session.selectedGroupFullName}"\n\nМожете отправить следующего участника или /cancel для завершения`
        );
      } catch (error) {
        console.error('Error adding participant:', error);
        await ctx.reply('Произошла ошибка при добавлении участника');
        return ctx.scene.leave();
      }
    }
  }
);

addParticipantsWizard.command('cancel', async ctx => {
  await ctx.reply('Операция завершена');
  return ctx.scene.leave();
});

const stage = new Scenes.Stage<SantaContext>([addParticipantsWizard]);

export const addParticipantsCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('addparticipants', ctx => ctx.scene.enter('addparticipants'));
};
