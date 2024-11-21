import {Telegraf, Scenes, Markup} from 'telegraf';
import {User} from '../../../db/models/user';
import {SantaContext} from '../../../types';
import {UserService} from '../../../services/user-service';
import {privateMessages} from '../../../constants/private-messages';

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
          message: privateMessages.UPDATE_ERROR,
        };
      }

      return {
        success: true,
        message: privateMessages.UPDATE_SUCCESS,
      };
    } catch (error) {
      console.error('Error updating wishes:', error);
      return {
        success: false,
        message: privateMessages.UPDATE_ERROR,
      };
    }
  }
}

class WishesSceneHandler {
  static async handleInitialStep(ctx: SantaContext) {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await ctx.reply(privateMessages.REGISTRATION_REQUIRED);
      await ctx.scene.leave();
      return;
    }

    await ctx.reply(privateMessages.WISHES_PROMPT, {
      parse_mode: 'Markdown',
    });

    return ctx.wizard.next();
  }

  static async handleWishesInput(ctx: SantaContext) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(privateMessages.TEXT_REQUIRED);
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(privateMessages.USER_NOT_FOUND);
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
