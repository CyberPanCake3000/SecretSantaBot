import {Telegraf, Scenes} from 'telegraf';
import {SantaContext} from '../../../types';
import {validateAndFormatDate} from '../../../utils/validateAndFormatDate';
import {User} from '../../../db/models/user';
import {PRIVATE_MESSAGES} from '../../../constants/private-messages';
import {GroupService} from '../../../services/group-service';
import {INLINE_KEYBOARDS} from '../../../constants/buttons';

const isValidPrice = (price: string): boolean => {
  const priceNumber = Number(price);
  return !isNaN(priceNumber) && priceNumber > 0;
};

export const createGroupWizard = new Scenes.WizardScene<SantaContext>(
  'create',
  async ctx => {
    ctx.scene.session.groupData = {
      minPrice: undefined,
      maxPrice: undefined,
      eventDate: undefined,
      eventInfo: undefined,
    };

    await ctx.reply(PRIVATE_MESSAGES.ENTER.MIN_PRICE);
    return ctx.wizard.next();
  },
  async ctx => {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !isValidPrice(ctx.message.text)
    ) {
      await ctx.reply(PRIVATE_MESSAGES.WRONG_ENTER.PRICE);
      return;
    }

    const minPrice = Number(ctx.message.text);
    ctx.scene.session.groupData.minPrice = minPrice;

    await ctx.reply(PRIVATE_MESSAGES.ENTER.MAX_PRICE);
    return ctx.wizard.next();
  },
  async ctx => {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !isValidPrice(ctx.message.text)
    ) {
      await ctx.reply(PRIVATE_MESSAGES.WRONG_ENTER.PRICE);
      return;
    }

    const maxPrice = Number(ctx.message.text);
    if (maxPrice <= ctx.scene.session.groupData.minPrice!) {
      await ctx.reply(PRIVATE_MESSAGES.WRONG_ENTER.MAX_PRICE);
      return;
    }

    ctx.scene.session.groupData.maxPrice = maxPrice;
    await ctx.reply(PRIVATE_MESSAGES.ENTER.EVENT_DATE);
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(PRIVATE_MESSAGES.WRONG_ENTER.DATE_FORMAT);
      return;
    }

    const validationResult = validateAndFormatDate(ctx.message.text);

    if (!validationResult.isValid || !validationResult.mongoDate) {
      await ctx.reply(
        validationResult.error || PRIVATE_MESSAGES.WRONG_ENTER.DATE_FORMAT
      );
      return;
    }

    ctx.scene.session.groupData.eventDate = validationResult.mongoDate;
    await ctx.reply(PRIVATE_MESSAGES.ENTER.EVENT_INFO);
    return ctx.wizard.next();
  },

  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply(PRIVATE_MESSAGES.WRONG_ENTER.TEXT);
      return;
    }

    ctx.scene.session.groupData.eventInfo = ctx.message.text;
    const groupData = ctx.scene.session.groupData;

    try {
      const newGroup = await GroupService.createNewGroup(ctx);
      if (!newGroup) {
        throw new Error('No group added');
      }

      await User.findOneAndUpdate(
        {telegramId: ctx.from!.id},
        {
          $push: {
            groups: {
              groupId: newGroup._id,
              role: 'admin',
              participationStatus: 'confirmed',
              notificationEnabled: true,
            },
          },
        },
        {new: true, upsert: true}
      );

      await ctx.reply(
        PRIVATE_MESSAGES.GROUP_CREATE.SUCCESS(groupData),
        INLINE_KEYBOARDS.NEW_GROUP_CREATED(
          ctx.botInfo.username,
          newGroup._id.toString()
        )
      );
      return ctx.scene.leave();
    } catch (error) {
      console.error('Error creating group:', error);
      await ctx.reply(PRIVATE_MESSAGES.GROUP_CREATE.FAIL);
      return ctx.scene.leave();
    }
  }
);

createGroupWizard.command('cancel', async ctx => {
  await ctx.reply(PRIVATE_MESSAGES.GROUP_CREATE.CANCELLED);
  return ctx.scene.leave();
});

const stage = new Scenes.Stage<SantaContext>([createGroupWizard]);

export const createGroupCommand = (bot: Telegraf<SantaContext>) => {
  bot.use(stage.middleware());
  bot.action('create', ctx => ctx.scene.enter('create'));
  bot.command('create', ctx => ctx.scene.enter('create'));
};
