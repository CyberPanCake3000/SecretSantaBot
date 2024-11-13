import {Telegraf, session} from 'telegraf';
import config from '../config';
import {SantaContext} from './../types';

const bot = new Telegraf<SantaContext>(config.telegramBotToken);

bot.use(session());
bot.command('info', ctx =>
  ctx.reply(
    '🎅 Я — бот *Тайный Санта* и помогу облегчить подготовку к Новому Году\\!\n\n' +
      '🎁 Что я умею:\n\n' +
      '1\\. /create — создать свою группу и пригласить друзей для игры\n' +
      '2\\. /join — присоединиться к существующей группе \\(потребуется _уникальный код_\\)\n' +
      '3\\. /groupinfo — узнать информацию о своих группах\n\n' +
      '✨ Давай начнем готовиться к празднику вместе\\!',
    {parse_mode: 'MarkdownV2'}
  )
);

export {bot};
