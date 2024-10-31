import {Telegraf, session} from 'telegraf';
import config from '../config';
import {SantaContext} from './../types';
import {registrationCommand} from './commands/user/registration';
import {setWishesCommand} from './commands/user/setWishes';
import {createGroupCommand} from './commands/group/create';
import {deleteGroupCommand} from './commands/group/delete';

const bot = new Telegraf<SantaContext>(config.telegramBotToken);

bot.use(session());

bot.command('start', ctx => ctx.reply('Добро пожаловать в Secret Santa бот!'));
bot.command('info', ctx =>
  ctx.reply(
    'Я -- бот **Тайный Санта** и помогаю людям облегчить подготовку к Новому Году!\n\n' +
      'Ты можешь создать собственную группу и пригласить туда людей для игры в Тайного Санту, для этого нужно ввести команду /create.\n' +
      'Или можешь присоединиться к уже готовой группе по команде /join, но тебе нужен __уникальный код__ для добавления в группу.\n' +
      'Если ты хочешь узнать информацию о группах, в которых ты уже состоишь -- введи команду /groupinfo.'
  )
);

registrationCommand(bot);
setWishesCommand(bot);
createGroupCommand(bot);
deleteGroupCommand(bot);

export {bot};
