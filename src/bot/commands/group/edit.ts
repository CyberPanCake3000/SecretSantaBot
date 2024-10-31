import {Scenes, Markup} from 'telegraf';
import {SantaContext} from '../../../types';
import {Group} from '../../../db/models/group';

export const editGroupWizard = new Scenes.WizardScene<SantaContext>(
  'edit',
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
            `edit_group_${group._id}`
          ),
        ];
      }),
      [Markup.button.callback('Отмена', 'cancel_edit')],
    ]);

    await ctx.reply(
      'Выберите группу, которую желаете отредактировать:',
      keyboard
    );

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

    if (callbackData === 'cancel_edit') {
      await ctx.reply('Операция отменена');
      return ctx.scene.leave();
    }

    if (!callbackData.startsWith('edit_group_')) {
      return;
    }

    const groupId = callbackData.replace('delete_group_', '');
    const groupToEdit = await Group.findOne({_id: groupId});

    if (!groupToEdit) {
      await ctx.reply(
        'Группа не найдена или у вас нет прав на её редактирование'
      );
      return ctx.scene.leave();
    }

    ctx.scene.session.groupToDelete = groupId;

    // СДЕЛАТЬ КЛАВИАТУРУ С КНОПКАМИ ПОЛЕ КОТОРЫЕ МОЖНО РЕДАКТИРОВАТЬ (ИМЯ, ДАТА, ИНФО)
    const confirmKeyboard = Markup.inlineKeyboard([
      Markup.button.callback('Да, удалить', `confirm_delete_${groupId}`),
      Markup.button.callback('Отмена', 'cancel_delete'),
    ]);

    const formattedDate = new Date(groupToEdit.eventDate).toLocaleDateString(
      'ru-RU',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );

    await ctx.reply(
      `Вы уверены, что хотите удалить группу "${groupToEdit.name}, ${formattedDate}"?`,
      confirmKeyboard
    );

    return ctx.wizard.next();
  }
);
