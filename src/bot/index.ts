import {Telegraf} from 'telegraf';
import config from '../config';

const bot = new Telegraf(config.telegramBotToken);

bot.command('start', ctx => ctx.reply('Добро пожаловать в Secret Santa бот!'));

export {bot};
