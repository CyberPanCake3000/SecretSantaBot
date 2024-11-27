import {Telegraf, session} from 'telegraf';
import config from '../config';
import {SantaContext} from './../types';
import {startCommand} from './commands/private/start';
import {setWishesCommand} from './commands/private/setWishes';
import {PRIVATE_MESSAGES} from '../constants/private-messages';
import {createGroupCommand} from './commands/private/create';

const bot = new Telegraf<SantaContext>(config.telegramBotToken);

bot.use(session());
startCommand(bot);
setWishesCommand(bot);
createGroupCommand(bot);
bot.command('info', ctx => ctx.reply(PRIVATE_MESSAGES.INFO_SECRET_SANTA));

export {bot};
