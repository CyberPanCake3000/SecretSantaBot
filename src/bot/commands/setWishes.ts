import {Telegraf, Scenes} from 'telegraf';
import {User} from '../../db/models/user';
import {MyContext} from '../../types';
import {registrationWizard} from './registration';

export const setWishesWizard = new Scenes.WizardScene<MyContext>(
  'setwishes',
  async ctx => {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Не удалось получить информацию о пользователе.');
      return ctx.scene.leave();
    }

    const user = await User.findOne({telegramId: userId});
    if (!user) {
      ctx.scene.session.registrationRequired = true;
      await ctx.reply(
        'Для установки пожеланий необходимо сначала зарегистрироваться.'
      );
      return ctx.scene.enter('registration');
    }

    await ctx.reply('Пожалуйста, введите ваши пожелания для подарка');
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите ваши пожелания текстом');
      return;
    }

    const wishes = ctx.message.text.trim();
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось получить информацию о пользователе.');
      return ctx.scene.leave();
    }

    try {
      const user = await User.findOneAndUpdate(
        {telegramId: userId},
        {wishes: wishes},
        {new: true}
      );

      if (!user) {
        await ctx.reply(
          'Произошла ошибка при обновлении пожеланий. Пожалуйста, попробуйте позже.'
        );
        return ctx.scene.leave();
      }

      await ctx.reply('Ваши пожелания успешно обновлены!');
    } catch (error) {
      console.error('Ошибка при обновлении пожеланий:', error);
      await ctx.reply(
        'Произошла ошибка при обновлении пожеланий. Пожалуйста, попробуйте позже.'
      );
    }

    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage<MyContext>([
  setWishesWizard,
  registrationWizard,
]);

export const setWishesCommand = (bot: Telegraf<MyContext>) => {
  bot.use(stage.middleware());
  bot.command('setwishes', ctx => ctx.scene.enter('setwishes'));
};
