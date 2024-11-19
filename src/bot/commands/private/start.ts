import {Scenes, Markup, Telegraf} from 'telegraf';
import {User, IUser} from '../../../db/models/user';
import {Group, IGroup} from '../../../db/models/group';
import {SantaContext} from '../../../types';

const messages = {
  PRIVATE_WELCOME: {
    NEW: `🎅 Привет! Я бот Тайный Санта!
Я помогу организовать праздничный обмен подарками в вашей группе.

Чтобы начать, добавьте меня в групповой чат, и я помогу настроить игру.`,
    REGISTRATION_MEMBER: `🎅 Привет! Я бот Тайный Санта!
Я помогу организовать праздничный обмен подарками в вашей группе.

Чтобы начать, добавьте меня в групповой чат, и я помогу настроить игру.`,
    EXISTING: `🎅 С возвращением!
Вы уже учавствуете в Тайном Санте, выберите ваше дальнейшее действие`,
  },
  GROUP_WELCOME: (adminMention: string) =>
    `🎅 Привет всем!
Я бот Тайный Санта, и я помогу организовать веселый обмен подарками!

Для участия, пожалуйста:
1. Напишите мне в личные сообщения
2. Заполните свои пожелания для подарка
3. Дождитесь жеребьевки и узнайте, кому вы будете дарить подарок

По всем вопросам обращайтесь к администратору игры: ${adminMention}`,
};

type ChatType = 'private' | 'group' | 'supergroup';

class ButtonFactory {
  static getCommonButtons(botUsername: string) {
    return [
      [
        Markup.button.url(
          '👥 Добавить Тайного Санту в чат',
          `https://t.me/${botUsername}?startgroup=true`
        ),
      ],
      [
        Markup.button.callback(
          '🎁 Оставить свои пожелания Тайному Санте',
          'setWishes'
        ),
      ],
      [Markup.button.callback('❔ Узнать кому я дарю подарок', 'myWard')],
    ];
  }

  static getRegistrationButton(botUsername: string, chatId: number) {
    return [
      [
        Markup.button.url(
          'Зарегистрироваться',
          `https://t.me/${botUsername}?start=${chatId}`
        ),
      ],
    ];
  }
}

class UserService {
  static async createUser(ctx: SantaContext): Promise<IUser> {
    const user = new User({
      telegramId: ctx.from?.id,
      telegramUsername: ctx.from?.username,
      telegramFirstName: ctx.from?.first_name,
      telegramLastName: ctx.from?.last_name,
    });
    return await user.save();
  }

  static async findUser(telegramId: number): Promise<IUser | null> {
    return await User.findOne({telegramId});
  }
}

class GroupService {
  static async findGroup(telegramGroupId: number): Promise<IGroup | null> {
    return await Group.findOne({telegramGroupId});
  }

  static async createOrGetGroup(ctx: SantaContext): Promise<IGroup> {
    const existingGroup = await this.findGroup(ctx.chat?.id || 0);

    if (existingGroup) return existingGroup;

    const group = new Group({
      telegramGroupName: ctx.getChat.name || '',
      telegramGroupId: ctx.chat?.id,
      adminTelegramId: ctx.from?.id,
      adminUsername: ctx.from?.username,
      eventDate: new Date(),
      minPrice: 0,
      maxPrice: 0,
    });

    const savedGroup = await group.save();
    ctx.scene.session.currentGroup = savedGroup;
    return savedGroup;
  }
}

class MessageHandler {
  static async sendNewGroupMemberMessage(ctx: SantaContext): Promise<void> {
    const buttons = ButtonFactory.getCommonButtons(ctx.botInfo?.username || '');
    await ctx.reply(
      messages.PRIVATE_WELCOME.REGISTRATION_MEMBER,
      Markup.inlineKeyboard(buttons)
    );
  }

  static async sendNewUserMessage(ctx: SantaContext): Promise<void> {
    const buttons = ButtonFactory.getCommonButtons(ctx.botInfo?.username || '');
    await ctx.reply(
      messages.PRIVATE_WELCOME.NEW,
      Markup.inlineKeyboard(buttons)
    );
  }

  static async sendExistingUserMessage(ctx: SantaContext): Promise<void> {
    const buttons = ButtonFactory.getCommonButtons(ctx.botInfo?.username || '');
    await ctx.reply(
      messages.PRIVATE_WELCOME.EXISTING,
      Markup.inlineKeyboard(buttons)
    );
  }

  static async sendGroupWelcomeMessage(ctx: SantaContext): Promise<void> {
    const groupInfo = ctx.scene.session.currentGroup;
    const admin = await ctx.telegram.getChatMember(
      ctx.chat?.id || 0,
      groupInfo.adminTelegramId
    );

    const adminMention = admin.user.username
      ? `@${admin.user.username}`
      : `[${admin.user.first_name}](tg://user?id=${admin.user.id})`;

    const buttons = ButtonFactory.getRegistrationButton(
      ctx.botInfo?.username || '',
      ctx.chat?.id || 0
    );
    await ctx.reply(
      messages.GROUP_WELCOME(adminMention),
      Markup.inlineKeyboard(buttons)
    );
  }
}

class SceneHandler {
  static async handleRegistration(
    ctx: SantaContext,
    groupId: string
  ): Promise<void> {
    const group = await GroupService.findGroup(Number(groupId));
    if (!group) {
      await ctx.reply('Такой группы не существует или произошла ошибка!');
      return ctx.scene.leave();
    }

    const user = await UserService.findUser(ctx.from?.id || 0);
    if (!user) {
      await MessageHandler.sendNewGroupMemberMessage(ctx);
      await UserService.createUser(ctx);
    } else {
      await MessageHandler.sendExistingUserMessage(ctx);
    }
  }

  static async handlePrivateChat(ctx: SantaContext): Promise<void> {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await UserService.createUser(ctx);
      await MessageHandler.sendNewUserMessage(ctx);
    } else {
      await MessageHandler.sendExistingUserMessage(ctx);
    }
  }

  static async handleGroupChat(ctx: SantaContext): Promise<void> {
    if (!ctx.chat?.id || !ctx.from?.id) return;

    await GroupService.createOrGetGroup(ctx);
    await MessageHandler.sendGroupWelcomeMessage(ctx);
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
