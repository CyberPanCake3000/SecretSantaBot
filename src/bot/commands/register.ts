import {Telegraf, Scenes, Context, session} from 'telegraf';
import {User} from '../../db/models/user';

type MyWizardSession = Scenes.WizardSessionData;

export interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}

const isValidName = (name: string): boolean => {
  // Регулярное выражение для проверки наличия только букв, цифр, пробелов и некоторых знаков препинания
  const nameRegex = /^[\p{L}\p{N}\s.,'-]+$/u;
  return name.length >= 2 && nameRegex.test(name);
};

const registerWizard = new Scenes.WizardScene<MyContext>(
  'register',
  async ctx => {
    await ctx.reply('Пожалуйста, введите Ваше имя');
    return ctx.wizard.next();
  },
  async ctx => {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !isValidName(ctx.message.text)
    ) {
      await ctx.reply('Пожалуйста, введите Ваше имя текстом');
      return;
    }

    const userName = ctx.message.text.trim();
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось получить информацию о пользователе.');
      return ctx.scene.leave();
    }

    try {
      const existingUser = await User.findOne({telegramId: userId});
      if (existingUser) {
        await ctx.reply('Вы уже зарегистрированы в игре Secret Santa!');
        return ctx.scene.leave();
      }

      const newUser = new User({
        telegramId: userId,
        name: userName,
      });

      await newUser.save();
      await ctx.reply(
        `Поздравляем, ${userName}! Вы успешно зарегистрированы в игре Secret Santa.`
      );
      await ctx.reply(
        'Теперь вы можете установить свои пожелания с помощью команды /setwishes и бюджет с помощью /setbudget.'
      );
    } catch (error) {
      console.error('Ошибка при регистрации пользователя:', error);
      await ctx.reply(
        'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.'
      );
    }

    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage<MyContext>([registerWizard]);

export const registerCommand = (bot: Telegraf<MyContext>) => {
  bot.use(session());
  bot.use(stage.middleware());
  bot.command('register', ctx => ctx.scene.enter('register'));
};
