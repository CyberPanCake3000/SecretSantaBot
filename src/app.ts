import ConfigService from './config';
import TelegramBot from './bot/TelegramBot';

class App {
  configService: ConfigService;
  bot: TelegramBot;

  constructor() {
    this.configService = new ConfigService();
    this.bot = new TelegramBot(this.configService.get('TG_APIKEY'));
    this.bot.start(ctx => {
      console.log('started');
      ctx.reply('hello!');
    });
    console.log('hello!');
    this.bot.launch();
  }
}

const main = async () => {
  const app = new App();
};

main();
