import {Scenes, Markup, Telegraf} from 'telegraf';
import {Group} from '../../../db/models/group';
import {SantaContext} from '../../../types';

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
      ctx.scene.session.selectedGroupId = userGroups[0]._id.toString();
      await ctx.reply(
        'Отправьте мне контакт нового участника. \n\nДля завершения введите /cancel'
      );
      return ctx.wizard.next();
    }

    const keyboard = Markup.inlineKeyboard([
      ...userGroups.map(group => {
        const formattedDate = new Date(group.eventDate).toLocaleDateString(
          'ru-RU',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }
        );

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
    console.log('1 step is here');
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    await ctx.deleteMessage();

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'close_add') {
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

      ctx.scene.session.selectedGroupId = groupId;
      await ctx.answerCbQuery();
      await ctx.reply(
        'Отправьте мне контакт нового участника\n\nДля завершения введите /cancel'
      );

      if ('message' in ctx.update) {
        const message = ctx.update.message;

        if ('text' in message && message.text === '/cancel') {
          await ctx.reply('Операция завершена');
          return ctx.scene.leave();
        }

        let userId: number | undefined;

        if ('contact' in message && message.contact) {
          userId = message.contact.user_id;
        }

        if (!userId) {
          await ctx.reply(
            'Пожалуйста, отправьте корректный контакт пользователя'
          );
          return;
        }

        try {
          console.log('we are adding new people here');
          const groupId = ctx.scene.session.selectedGroupId;
          const group = await Group.findById(groupId);

          if (!group) {
            await ctx.reply('Группа не найдена');
            return ctx.scene.leave();
          }

          console.log('1');

          const existingUser = group.allowedUsers.find(
            user => user.userTelegramId === userId
          );

          console.log('2');

          if (existingUser) {
            await ctx.reply('Пользователь уже добавлен в группу');
            return;
          }

          console.log('3');

          group.allowedUsers.push({
            userTelegramId: userId,
            status: 'pending',
            invitedAt: new Date(),
          });

          console.log('4');

          await group.save();
          await ctx.reply(
            'Пользователь успешно добавлен в группу\n\nМожете отправить следующего участника или /cancel для завершения'
          );
        } catch (error) {
          console.error('Error adding participant:', error);
          await ctx.reply('Произошла ошибка при добавлении участника');
          return ctx.scene.leave();
        }
      }

      return ctx.scene.leave();
    }
  }
);

const stage = new Scenes.Stage<SantaContext>([addParticipantsWizard]);

export const addParticipantsCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('addparticipants', ctx => ctx.scene.enter('addparticipants'));
};
