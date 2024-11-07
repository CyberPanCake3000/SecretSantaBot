import {Telegraf, session} from 'telegraf';
import config from '../config';
import {SantaContext} from './../types';
import {registrationCommand} from './commands/user/registration';
import {setWishesCommand} from './commands/user/setWishes';
import {createGroupCommand} from './commands/group/create';
import {deleteGroupCommand} from './commands/group/delete';
import {groupInfoCommand} from './commands/group/groupinfo';
import {inviteCommand} from './commands/admin/invite';
import {joinCommand} from './commands/user/join';
import {kickCommand} from './commands/admin/kick';

const bot = new Telegraf<SantaContext>(config.telegramBotToken);

bot.use(session());

bot.command('start', ctx => ctx.reply('Добро пожаловать в Secret Santa бот!'));
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

registrationCommand(bot);
setWishesCommand(bot);
createGroupCommand(bot);
deleteGroupCommand(bot);
groupInfoCommand(bot);
inviteCommand(bot);
joinCommand(bot);
kickCommand(bot);

export {bot};
