import {Telegraf, Scenes} from 'telegraf';
import {User} from '../../../db/models/user';
import {SantaContext} from '../../../types';

const isValidName = (name: string): boolean => {
  const nameRegex = /^[а-яёА-ЯЁa-zA-Z\s.,'-]+$/u;
  return name.length >= 2 && nameRegex.test(name);
};

export const registrationWizard = new Scenes.WizardScene<SantaContext>(
  'registration',
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
        'Теперь вы можете установить свои пожелания с помощью команды /setwishes'
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

const stage = new Scenes.Stage<SantaContext>([registrationWizard]);

export const registrationCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.command('registration', ctx => ctx.scene.enter('registration'));
};
