import {Telegraf, session} from 'telegraf';
import config from '../config';
import {MyContext, registerCommand} from './commands/register';

const bot = new Telegraf<MyContext>(config.telegramBotToken);

bot.command('start', ctx => ctx.reply('Добро пожаловать в Secret Santa бот!'));
registerCommand(bot);

export {bot};
