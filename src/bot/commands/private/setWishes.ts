import {Telegraf, Scenes, Markup} from 'telegraf';
import {User} from '../../../db/models/user';
import {SantaContext} from '../../../types';
import {UserService} from '../../../services/user-service';
import {PRIVATE_MESSAGES} from '../../../constants/private-messages';
import {BUTTONS} from '../../../constants/buttons';

class WishesSceneHandler {
  static async handleInitialStep(ctx: SantaContext) {
    if (!ctx.from?.id) return;

    const user = await UserService.findUser(ctx.from.id);
    if (!user) {
      await ctx.reply(PRIVATE_MESSAGES.REGISTRATION_REQUIRED);
      await ctx.scene.leave();
      return;
    }

    await ctx.reply(PRIVATE_MESSAGES.WISHES_PROMPT, {
      parse_mode: 'Markdown',
    });

    return ctx.wizard.next();
  }

  static async handleWishesInput(ctx: SantaContext) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(PRIVATE_MESSAGES.TEXT_REQUIRED);
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(PRIVATE_MESSAGES.USER_NOT_FOUND);
      return ctx.scene.leave();
    }

    const wishes = ctx.message.text.trim();
    let message = '';
    const buttons = Markup.inlineKeyboard([
      [BUTTONS.QUIT],
      [BUTTONS.GROUP_INFO],
    ]);

    try {
      const user = await User.findOneAndUpdate(
        {telegramId: userId},
        {wishes},
        {new: true}
      );

      message = user
        ? PRIVATE_MESSAGES.UPDATE_SUCCESS
        : PRIVATE_MESSAGES.UPDATE_ERROR;
    } catch (error) {
      console.error('Error updating wishes:', error);
      message = PRIVATE_MESSAGES.UPDATE_ERROR;
    }
    await ctx.reply(message, buttons);
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
