import {Telegraf, Scenes, Markup} from 'telegraf';
import {User} from '../../../db/models/user';
import {SantaContext} from '../../../types';
import {UserService} from '../../../services/user-service';

const messages = {
  REGISTRATION_REQUIRED:
    '🎯 Для заполнения пожеланий нужно зарегистрироваться, введите команду /start',
  WISHES_PROMPT: `🎁 *Настройка пожеланий для подарка*

✍️ Пожалуйста, напишите ваши пожелания:
• что вам нравится
• какие у вас хобби
• что бы вы хотели получить

💫 Ваши пожелания помогут Тайному Санте выбрать идеальный подарок и сделать праздник действительно волшебным!`,
  TEXT_REQUIRED: '📝 Пожалуйста, введите ваши пожелания текстом',
  USER_NOT_FOUND: '❌ Не удалось получить информацию о пользователе.',
  UPDATE_ERROR:
    '❌ Произошла ошибка при обновлении пожеланий. Пожалуйста, попробуйте позже.',
  UPDATE_SUCCESS: '✅ Ваши пожелания успешно обновлены!',
};

interface WishesUpdateResult {
  success: boolean;
  message: string;
}

class WishesService {
  static async updateUserWishes(
    userId: number,
    wishes: string
  ): Promise<WishesUpdateResult> {
    try {
      const user = await User.findOneAndUpdate(
        {telegramId: userId},
        {wishes},
        {new: true}
      );

      if (!user) {
        return {
          success: false,
          message: messages.UPDATE_ERROR,
        };
      }

      return {
        success: true,
        message: messages.UPDATE_SUCCESS,
      };
    } catch (error) {
      console.error('Error updating wishes:', error);
      return {
        success: false,
        message: messages.UPDATE_ERROR,
      };
    }
  }
}

class WishesSceneHandler {
  static async handleInitialStep(ctx: SantaContext) {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await ctx.reply(messages.REGISTRATION_REQUIRED);
      await ctx.scene.leave();
      return;
    }

    await ctx.reply(messages.WISHES_PROMPT, {
      parse_mode: 'Markdown',
    });

    return ctx.wizard.next();
  }

  static async handleWishesInput(ctx: SantaContext) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(messages.TEXT_REQUIRED);
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(messages.USER_NOT_FOUND);
      return ctx.scene.leave();
    }

    const preferences = ctx.message.text.trim();
    const result = await WishesService.updateUserWishes(userId, preferences);
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('Отказаться от участия', 'quit')],
      [Markup.button.callback('Узнать информацию о группе', 'groupinfo')],
    ]);
    await ctx.reply(result.message, buttons);
    return ctx.scene.leave();
  }
}

const setWishesWizard = new Scenes.WizardScene<SantaContext>(
  'setwishes',
  WishesSceneHandler.handleInitialStep,
  WishesSceneHandler.handleWishesInput
);

const stage = new Scenes.Stage<SantaContext>([setWishesWizard]);

export const setWishesCommand = (bot: Telegraf<SantaContext>): void => {
  bot.use(stage.middleware());
  bot.action('setwishes', ctx => ctx.scene.enter('setwishes'));
  bot.command('setwishes', ctx => ctx.scene.enter('setwishes'));
};
