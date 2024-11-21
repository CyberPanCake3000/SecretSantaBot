import {Scenes, Telegraf} from 'telegraf';
import {SantaContext} from '../../../types';
import {UserService} from '../../../services/user-service';
import {GroupService} from '../../../services/group-service';
import {groupMessages} from '../../../constants/group-messages';
import {privateMessages} from '../../../constants/private-messages';
import {INLINE_KEYBOARDS} from '../../../constants/buttons';

type ChatType = 'private' | 'group' | 'supergroup';

class SceneHandler {
  static async handleRegistration(
    ctx: SantaContext,
    groupId: string
  ): Promise<void> {
    const group = await GroupService.findGroup(Number(groupId));
    if (!group) {
      await ctx.reply(privateMessages.GROUP_NOT_FOUND);
      return ctx.scene.leave();
    }

    const user = await UserService.findUser(ctx.from?.id || 0);
    if (!user) {
      await ctx.reply(
        privateMessages.WELCOME.REGISTRATION_MEMBER,
        INLINE_KEYBOARDS.WELCOME_PRIVATE_MENU(ctx.botInfo?.username || '')
      );
      await UserService.createUser(ctx);
    } else {
      await ctx.reply(
        privateMessages.WELCOME.EXISTING_MEMBER,
        INLINE_KEYBOARDS.WELCOME_PRIVATE_MENU(ctx.botInfo?.username || '')
      );
    }
  }

  static async handlePrivateChat(ctx: SantaContext): Promise<void> {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await UserService.createUser(ctx);
      await ctx.reply(
        privateMessages.WELCOME.NEW,
        INLINE_KEYBOARDS.WELCOME_PRIVATE_MENU(ctx.botInfo?.username || '')
      );
    } else {
      await ctx.reply(
        privateMessages.WELCOME.EXISTING_MEMBER,
        INLINE_KEYBOARDS.WELCOME_PRIVATE_MENU(ctx.botInfo?.username || '')
      );
    }
  }

  static async handleGroupChat(ctx: SantaContext): Promise<void> {
    if (!ctx.chat?.id || !ctx.from?.id) return;

    await GroupService.createOrGetGroup(ctx);
    const groupInfo = ctx.scene.session.currentGroup;
    const admin = await ctx.telegram.getChatMember(
      ctx.chat?.id || 0,
      groupInfo.adminTelegramId
    );

    const adminMention = admin.user.username
      ? `@${admin.user.username}`
      : `[${admin.user.first_name}](tg://user?id=${admin.user.id})`;

    await ctx.reply(
      groupMessages.WELCOME(adminMention),
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
    await SceneHandler.handleGroupChat(ctx);
  }

  return ctx.scene.leave();
});

const stage = new Scenes.Stage<SantaContext>([startWizard]);

export const startCommand = (bot: Telegraf<SantaContext>): void => {
  bot.use(stage.middleware());
  bot.command('start', ctx => ctx.scene.enter('start'));
};
