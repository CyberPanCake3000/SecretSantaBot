import {Telegraf, Scenes} from 'telegraf';
import {User} from '../../../db/models/user';
import {Group} from '../../../db/models/group';
import {SantaContext} from '../../../types';
import {isValidGroupCode} from '../../../utils/isValidGroupCode';

export const joinWizard = new Scenes.WizardScene<SantaContext>(
  'join',
  async ctx => {
    await ctx.reply(
      'Вы хотите присоединиться к существующей группе, введите уникальный `код группы` или введите команду /cancel для отмены действия'
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите код текстом');
      return;
    }

    const groupCode = ctx.message.text;

    if (!isValidGroupCode(groupCode)) {
      await ctx.reply(
        'Неверный формат кода группы. Пожалуйста, проверьте код и попробуйте снова'
      );
      return;
    }

    try {
      const group = await Group.findOne({uniqueCode: groupCode});

      if (!group) {
        await ctx.reply(
          'Группа не найдена. Пожалуйста, проверьте код и попробуйте снова'
        );
        return;
      }

      const user = await User.findOne({telegramId: ctx.from?.id});

      if (!user) {
        await ctx.reply(
          'Пожалуйста, сначала зарегистрируйтесь с помощью команды /registration'
        );
        return ctx.scene.leave();
      }

      const isAlreadyInGroup = user.groups.some(
        g => g.groupId.toString() === group._id.toString()
      );

      if (isAlreadyInGroup) {
        await ctx.reply('Вы уже являетесь участником этой группы');
        return ctx.scene.leave();
      }

      const isAllowed = group.allowedUsers.some(
        allowedUser => allowedUser.userTelegramId === user.telegramId
      );

      if (!isAllowed) {
        await ctx.reply(
          'Вы не находитесь в списке разрешенных участников. Пожалуйста, обратитесь к администратору группы'
        );
        return ctx.scene.leave();
      }

      const newParticipant = {
        userTelegramId: user.telegramId,
        username: user.telegramUsername,
        joinedAt: new Date(),
        participationStatus: 'confirmed',
      };

      group.participants.push(newParticipant);
      await group.save();

      user.groups.push({
        groupId: group._id,
        groupName: group.name, // TODO: наверное стоит устранить это поле??
        role: 'participant',
        participationStatus: 'confirmed', // TODO: разобраться с кучей статусов в разных объектах, возможно будет мешать в разных местах
        giftStatus: 'not_bought',
        notificationEnabled: true,
      });
      await user.save();

      await ctx.reply(
        `Поздравляем! Вы успешно присоединились к группе "${group.name}"`
      );
      return ctx.scene.leave();
    } catch (error) {
      console.error('Error joining group:', error);
      await ctx.reply(
        'Произошла ошибка при присоединении к группе. Пожалуйста, попробуйте позже'
      );
      return ctx.scene.leave();
    }
  }
);

const stage = new Scenes.Stage<SantaContext>([joinWizard]);

export const joinCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('join', ctx => ctx.scene.enter('join'));
};
