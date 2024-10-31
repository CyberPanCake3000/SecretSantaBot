import {Scenes, Markup} from 'telegraf';
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
    return ctx.wizard.next();
  }
);
