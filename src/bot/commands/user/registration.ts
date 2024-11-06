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

    const enteredName = ctx.message.text.trim();
    const telegramUsername = ctx.from?.username;
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
        name: enteredName,
        telegramUsername,
      });

      await newUser.save();
      await ctx.reply(
        `Поздравляем, ${enteredName}! Вы успешно зарегистрированы в игре Secret Santa.`
      );
      await ctx.reply(
        '🎄 *Добро пожаловать в Secret Santa!*\n\n' +
          'Доступные команды:\n' +
          '📝 /setwishes - установить свои пожелания для подарка\n' +
          '🤝 /join - присоединиться к существующей группе\n' +
          '✨ /create - создать свою группу\n\n' +
          'Выберите команду, чтобы начать!',
        {
          parse_mode: 'Markdown',
        }
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
