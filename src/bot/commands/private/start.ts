import {Scenes, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {UserService} from '../../../services/user-service';
import {GroupService} from '../../../services/group-service';
import {GROUP_MESSAGES} from '../../../constants/group-messages';
import {PRIVATE_MESSAGES} from '../../../constants/private-messages';
import {INLINE_KEYBOARDS} from '../../../constants/buttons';
import {Group} from '../../../db/models/group';
type ChatType = 'private' | 'group' | 'supergroup';

class SceneHandler {
  static async handleRegistration(
    ctx: SantaContext,
    groupId: string
  ): Promise<void> {
    const group = await GroupService.findGroup(Number(groupId));
    if (!group) {
      await ctx.reply(PRIVATE_MESSAGES.GROUP_NOT_FOUND);
      return ctx.scene.leave();
    }

    if (!ctx.from?.id) throw new Error('No user found');
    let user = await UserService.findUser(ctx.from?.id);

    if (
      user &&
      user.groups.some(g => g.groupId.toString() === group._id.toString())
    ) {
      await ctx.reply(PRIVATE_MESSAGES.WELCOME.ALREADY_REGISTERED);
      return ctx.scene.leave();
    }

    if (!user) {
      user = await UserService.createUser(ctx);
    }

    try {
      user.groups.push({
        groupId: group._id,
        role: 'participant',
        participationStatus: 'pending',
        notificationEnabled: true,
      });
      await user.save();

      group.participants.push({
        userTelegramId: ctx.from?.id || 0,
        username: ctx.from?.username || ctx.from?.first_name || 'Аноним',
        joinedAt: new Date(),
        participationStatus: 'pending',
      });
      await group.save();

      await ctx.telegram.sendMessage(
        group.telegramGroupId,
        `🎅 К игре присоединился новый участник: ${ctx.from?.username ? '@' + ctx.from.username : ctx.from?.first_name}!`
      );

      await ctx.reply(
        'Вы успешно зарегистрировались в игре Тайный Санта!\n\n' +
          `📅 Дата мероприятия: ${group.eventDate.toLocaleDateString()}\n` +
          `💰 Бюджет подарка: от ${group.minPrice} до ${group.maxPrice} рублей\n` +
          `ℹ️ ${group.eventInfo ? `Дополнительная информация: ${group.eventInfo}` : ''}\n\n` +
          'Используйте команду /setwishes чтобы указать ваши пожелания для подарка.'
      );
    } catch (error) {
      console.error('Error registering user to group:', error);
      await ctx.reply(PRIVATE_MESSAGES.REGISTRATION_ERROR);

      if (user.groups.length > 0) {
        user.groups = user.groups.filter(
          g => g.groupId.toString() !== group._id.toString()
        );
        await user.save();
      }
      if (group.participants.length > 0) {
        group.participants = group.participants.filter(
          p => p.userTelegramId !== ctx.from?.id
        );
        await group.save();
      }
    }
  }

  static async handlePrivateChat(ctx: SantaContext): Promise<void> {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await UserService.createUser(ctx);
      await ctx.reply(
        PRIVATE_MESSAGES.WELCOME.NEW,
        INLINE_KEYBOARDS.WELCOME_NEW_USER
      );
    } else {
      await ctx.reply(
        PRIVATE_MESSAGES.WELCOME.EXISTING_MEMBER,
        INLINE_KEYBOARDS.WELCOME_PRIVATE_MENU(ctx.botInfo?.username || '')
      );
    }
  }

  static async handleNewGroupChat(ctx: SantaContext, groupId: string) {
    if (!ctx.chat?.id) throw new Error('No chat info');

    const group = await Group.findOne({_id: groupId});
    if (!group) throw new Error('No group found');

    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      group.telegramGroupId = ctx.chat.id;
      group.telegramGroupName = ctx.chat.title || '';
      await group.save();
    }

    const admin = await ctx.telegram.getChatMember(
      ctx.chat.id,
      group.adminTelegramId
    );

    const adminMention = admin.user.username
      ? `@${admin.user.username}`
      : `[${admin.user.first_name}](tg://user?id=${admin.user.id})`;

    await ctx.reply(
      GROUP_MESSAGES.WELCOME(adminMention),
      INLINE_KEYBOARDS.WELCOME_GROUP_MENU(
        ctx.botInfo?.username || '',
        ctx.chat.id
      )
    );
  }

  static async handleGroupChat(ctx: SantaContext): Promise<void> {
    if (!ctx.chat?.id || !ctx.from?.id) return;

    const groupInfo = await GroupService.createOrGetGroup(ctx);
    const admin = await ctx.telegram.getChatMember(
      ctx.chat?.id,
      groupInfo.adminTelegramId
    );

    const adminMention = admin.user.username
      ? `@${admin.user.username}`
      : `[${admin.user.first_name}](tg://user?id=${admin.user.id})`;

    await ctx.reply(
      GROUP_MESSAGES.WELCOME(adminMention),
      INLINE_KEYBOARDS.WELCOME_GROUP_MENU(
        ctx.botInfo?.username || '',
        ctx.chat?.id || 0
      )
    );
  }
}

const startWizard = new Scenes.WizardScene<SantaContext>('start', async ctx => {
  const payload =
    ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : '';

  const chatType = ctx.chat?.type as ChatType;

  if (chatType === 'private') {
    if (payload) {
      await SceneHandler.handleRegistration(ctx, payload);
    } else {
      await SceneHandler.handlePrivateChat(ctx);
    }
  } else if (['group', 'supergroup'].includes(chatType)) {
    if (payload) {
      await SceneHandler.handleNewGroupChat(ctx, payload);
    } else {
      await SceneHandler.handleGroupChat(ctx);
    }
  }

  return ctx.scene.leave();
});

const stage = new Scenes.Stage<SantaContext>([startWizard]);

export const startCommand = (bot: Telegraf<SantaContext>): void => {
  bot.use(stage.middleware());
  bot.command('start', ctx => ctx.scene.enter('start'));
};
