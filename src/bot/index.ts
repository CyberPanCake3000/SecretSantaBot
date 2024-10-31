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
registrationCommand(bot);
setWishesCommand(bot);
createGroupCommand(bot);
deleteGroupCommand(bot);

export {bot};
