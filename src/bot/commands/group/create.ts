import {Telegraf, Scenes} from 'telegraf';
import {MyContext} from '../../../types';
import {Group} from '../../../db/models/group';
import {generateGroupCode} from '../../../utils/groupCodeGenerator';
import {validateAndFormatDate} from '../../../utils/validateAndFormatDate';

const isValidGroupName = (name: string): boolean => {
  const nameRegex = /^[а-яёА-ЯЁa-zA-Z0-9\s.,'-]+$/u;
  return name.length >= 2 && nameRegex.test(name);
};

const isValidPrice = (price: string): boolean => {
  const priceNumber = Number(price);
  return !isNaN(priceNumber) && priceNumber > 0;
};

export const createGroupWizard = new Scenes.WizardScene<MyContext>(
  'create',
  async ctx => {
    await ctx.reply(
      'Давайте создадим Вашу группу! Для отмены создания группы введите команду /cancel. Для начала введите название группы:'
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите название группы текстом');
      return;
    }

    const name = ctx.message.text;
    if (!isValidGroupName(name)) {
      await ctx.reply('Некорректное название. Попробуйте еще раз');
      return;
    }

    ctx.scene.session.groupData = {name};
    await ctx.reply(
      'Отлично! Теперь введите минимальную стоимость подарка (в рублях):'
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !isValidPrice(ctx.message.text)
    ) {
      await ctx.reply('Пожалуйста, введите корректную сумму цифрами');
      return;
    }

    const minPrice = Number(ctx.message.text);
    ctx.scene.session.groupData.minPrice = minPrice;

    await ctx.reply(
      'Теперь введите максимальную стоимость подарка (в рублях):'
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      !isValidPrice(ctx.message.text)
    ) {
      await ctx.reply('Пожалуйста, введите корректную сумму цифрами');
      return;
    }

    const maxPrice = Number(ctx.message.text);
    if (maxPrice <= ctx.scene.session.groupData.minPrice!) {
      await ctx.reply(
        'Максимальная цена должна быть больше минимальной. Попробуйте еще раз:'
      );
      return;
    }

    ctx.scene.session.groupData.maxPrice = maxPrice;
    await ctx.reply(
      'Введите дату проведения мероприятия в формате ДД.ММ.ГГГГ:'
    );
    return ctx.wizard.next();
  },
  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите дату в формате ДД.ММ.ГГГГ');
      return;
    }

    const validationResult = validateAndFormatDate(ctx.message.text);

    if (!validationResult.isValid || !validationResult.mongoDate) {
      await ctx.reply(
        validationResult.error ||
          'Пожалуйста, введите корректную дату в формате ДД.ММ.ГГГГ'
      );
      return;
    }

    ctx.scene.session.groupData.eventDate = validationResult.mongoDate;
    await ctx.reply('Введите информацию о мероприятии:');
    return ctx.wizard.next();
  },

  async ctx => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Пожалуйста, введите информацию текстом');
      return;
    }

    const eventInfo = ctx.message.text;
    const groupData = ctx.scene.session.groupData;

    try {
      const uniqueCode = generateGroupCode();

      const newGroup = await Group.create({
        name: groupData.name,
        uniqueCode,
        eventDate: groupData.eventDate,
        eventInfo,
        adminTelegramId: ctx.from!.id,
        giftPriceRange: {
          min: groupData.minPrice,
          max: groupData.maxPrice,
        },
        status: 'active',
        drawStatus: 'pending',
        participants: [
          {
            userTelegramId: ctx.from!.id,
            username: ctx.from!.username || 'Unknown',
            participationStatus: 'confirmed',
            joinedAt: new Date(),
          },
        ],
        allowedUsers: [],
        santaPairs: [],
        drawHistory: [],
      });

      console.log(newGroup);

      await ctx.replyWithHTML(
        '🎅 Хо-хо-хо ваша группа успешно создана!\n\n' +
          `Название: ${groupData.name}\n` +
          `Дата мероприятия: ${groupData.eventDate!.toLocaleDateString()}\n` +
          `Стоимость подарка: ${groupData.minPrice} - ${groupData.maxPrice} руб.\n\n` +
          `Уникальный код для приглашения участников:\n<code>${uniqueCode}</code>\n\n` +
          'Отправь этот код участникам, чтобы они могли присоединиться к группе.'
      );
      return ctx.scene.leave();
    } catch (error) {
      console.error('Error creating group:', error);
      await ctx.reply(
        'Произошла ошибка при создании группы. Попробуйте еще раз.'
      );
      return ctx.scene.leave();
    }
  }
);

createGroupWizard.command('cancel', async ctx => {
  await ctx.reply('Создание группы отменено');
  return ctx.scene.leave();
});

const stage = new Scenes.Stage<MyContext>([createGroupWizard]);

export const createGroupCommand = (bot: Telegraf<MyContext>) => {
  bot.use(stage.middleware());
  bot.command('create', ctx => ctx.scene.enter('create'));
};
