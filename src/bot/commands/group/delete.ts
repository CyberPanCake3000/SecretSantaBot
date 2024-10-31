import {Scenes, Markup, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {Group} from '../../../db/models/group';
import {User} from '../../../db/models/user';

export const deleteGroupWizard = new Scenes.WizardScene<SantaContext>(
  'delete',
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
      await ctx.reply('У вас нет активных групп для удаления');
      return ctx.scene.leave();
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
            `delete_group_${group._id}`
          ),
        ];
      }),
      [Markup.button.callback('Отмена', 'cancel_delete')],
    ]);

    await ctx.reply('Выберите группу, которую желаете удалить:', keyboard);

    ctx.scene.session.userGroups = userGroups.map(group =>
      group._id.toString()
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    await ctx.deleteMessage();

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'cancel_delete') {
      await ctx.reply('Операция отменена');
      return ctx.scene.leave();
    }

    if (!callbackData.startsWith('delete_group_')) {
      return;
    }

    const groupId = callbackData.replace('delete_group_', '');
    const groupToDelete = await Group.findOne({_id: groupId});

    if (!groupToDelete) {
      await ctx.reply('Группа не найдена или у вас нет прав на её удаление');
      return ctx.scene.leave();
    }

    ctx.scene.session.groupToDelete = groupId;

    const confirmKeyboard = Markup.inlineKeyboard([
      Markup.button.callback('Да, удалить', `confirm_delete_${groupId}`),
      Markup.button.callback('Отмена', 'cancel_delete'),
    ]);

    const formattedDate = new Date(groupToDelete.eventDate).toLocaleDateString(
      'ru-RU',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );

    await ctx.reply(
      `Вы уверены, что хотите удалить группу "${groupToDelete.name}, ${formattedDate}"?`,
      confirmKeyboard
    );

    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }

    await ctx.deleteMessage();

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'cancel_delete') {
      await ctx.reply('Операция отменена');
      return ctx.scene.leave();
    }

    if (!callbackData.startsWith('confirm_delete_')) {
      return;
    }

    const groupId = callbackData.replace('confirm_delete_', '');
    const groupToDelete = await Group.findOne({_id: groupId});

    if (!groupToDelete) {
      await ctx.reply('Группа не найдена или у вас нет прав на её удаление');
      return ctx.scene.leave();
    }

    try {
      await Group.deleteOne({_id: groupId});
      // TODO: нужно еще запускать процесс по удалению этой группы из массивов всех участников??
      await User.findOneAndUpdate(
        {telegramId: ctx.from!.id},
        {
          $pull: {
            groups: {
              groupId: groupId,
            },
          },
        },
        {new: true}
      );
      await ctx.reply(`Группа "${groupToDelete.name}" успешно удалена`);
    } catch (error) {
      console.error('Ошибка при удалении группы:', error);
      await ctx.reply(
        'Произошла ошибка при удалении группы. Попробуйте позже.'
      );
    }

    return ctx.scene.leave();
  }
);

deleteGroupWizard.action('cancel_delete', async ctx => {
  await ctx.reply('Операция отменена');
  return ctx.scene.leave();
});

const stage = new Scenes.Stage<SantaContext>([deleteGroupWizard]);

export const deleteGroupCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('delete', ctx => ctx.scene.enter('delete'));
};
