import {Telegraf, session} from 'telegraf';
import config from '../config';
import {MyContext} from './../types';
import {registrationCommand} from './commands/registration';
import {setWishesCommand} from './commands/setWishes';

const bot = new Telegraf<MyContext>(config.telegramBotToken);

bot.use(session());

bot.command('start', ctx => ctx.reply('Добро пожаловать в Secret Santa бот!'));
registrationCommand(bot);
setWishesCommand(bot);

export {bot};
