import {Scenes, Markup, Telegraf} from 'telegraf';
import {User, IUser} from '../../../db/models/user';
import {Group, IGroup} from '../../../db/models/group';
import {SantaContext} from '../../../types';

const PRIVATE_WELCOME_NEW = `🎅 Привет! Я бот Тайный Санта!
Я помогу организовать праздничный обмен подарками в вашей группе.

Чтобы начать, добавьте меня в групповой чат, и я помогу настроить игру.`;

const PRIVATE_WELCOME_EXISTING = `🎅 С возвращением!
Вы уже учавствуете в Тайном Санте, выберите ваше дальнейшее действие`;

const GROUP_WELCOME = `🎅 Привет всем!
Я бот Тайный Санта, и я помогу организовать веселый обмен подарками!

Для участия, пожалуйста:
1. Напишите мне в личные сообщения
2. Заполните свои пожелания для подарка
3. Дождитесь жеребьевки и узнайте, кому вы будете дарить подарок

По всем вопросам обращайтесь к администратору игры: `;

const startWizard = new Scenes.WizardScene<SantaContext>('start', async ctx => {
  if (ctx.chat?.type === 'private') {
    await handlePrivateChat(ctx);
    return ctx.scene.leave();
  } else if (['group', 'supergroup'].includes(ctx.chat?.type || '')) {
    await handleGroupChat(ctx);
    return ctx.scene.leave();
  }

  return ctx.scene.leave();
});

async function handlePrivateChat(ctx: SantaContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  let user = await User.findOne({telegramId}).populate('groups.groupId');

  if (!user) {
    user = await createNewUser(ctx);
    await sendNewUserMessage(ctx);
  } else {
    await sendExistingUserMessage(ctx);
  }
}

async function handleGroupChat(ctx: SantaContext) {
  const chatId = ctx.chat?.id;
  const addedBy = ctx.from?.id;

  if (!chatId || !addedBy) return;

  await createNewGroup(ctx);
  await sendGroupWelcomeMessage(ctx);
}

async function createNewUser(ctx: SantaContext): Promise<IUser> {
  const user = new User({
    telegramId: ctx.from?.id,
    telegramUsername: ctx.from?.username,
    telegramFirstName: ctx.from?.first_name,
    telegramLastName: ctx.from?.last_name,
  });
  await user.save();
  return user;
}

async function createNewGroup(ctx: SantaContext) {
  const existingGroup = await Group.find({telegramGroupId: ctx.chat?.id});

  if (!existingGroup) {
    const group = new Group({
      telegramGroupName: ctx.getChat.name || '',
      telegramGroupId: ctx.chat?.id,
      adminTelegramId: ctx.from?.id,
      adminUsername: ctx.from?.username,
      eventDate: new Date(),
      minPrice: 0,
      maxPrice: 0,
    });
    await group.save();
    ctx.scene.session.currentGroup = group;
  }
  ctx.scene.session.currentGroup = existingGroup;
}

async function sendNewUserMessage(ctx: SantaContext) {
  const addToBotButton = Markup.inlineKeyboard([
    [
      Markup.button.url(
        'Добавить Тайного Санту в чат',
        `https://t.me/${ctx.botInfo?.username}?startgroup=true&admin=can_post_messages`
      ),
    ],
  ]);

  await ctx.reply(PRIVATE_WELCOME_NEW, addToBotButton);
}

async function sendExistingUserMessage(ctx: SantaContext) {
  const message = PRIVATE_WELCOME_EXISTING + '\n\n';

  const buttons = Markup.inlineKeyboard([
    [
      Markup.button.url(
        '👥 Добавить Тайного Санту в чат',
        `https://t.me/${ctx.botInfo?.username}?startgroup=true`
      ),
    ],
    [
      Markup.button.callback(
        '🎁 Оставить свои пожелания Тайному Санте',
        'setWishes'
      ),
    ],
    [Markup.button.callback('❔ Узнать кому я дарю подарок', 'myWard')],
  ]);

  await ctx.reply(message, buttons);
}

async function sendGroupWelcomeMessage(ctx: SantaContext) {
  const groupInfo = ctx.scene.session.currentGroup;
  const admin = await ctx.telegram.getChatMember(
    ctx.chat?.id || 0,
    groupInfo.adminTelegramId
  );
  const adminMention = admin.user.username
    ? `@${admin.user.username}`
    : `[${admin.user.first_name}](tg://user?id=${admin.user.id})`;

  await ctx.reply(GROUP_WELCOME + adminMention);
}

const stage = new Scenes.Stage<SantaContext>([startWizard]);

export const startCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('start', ctx => ctx.scene.enter('start'));
};
