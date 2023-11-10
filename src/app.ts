import ConfigService from './config';
import TelegramBot from './bot/TelegramBot';

class App {
  configService: ConfigService;
  bot: TelegramBot;

  constructor() {
    this.configService = new ConfigService();
    const tgAPI = this.configService.get('TG_APIKEY');
    const dbUrl = this.configService.get('MONGODB_URL');
    this.bot = new TelegramBot(tgAPI, dbUrl);
  }

  async start() {
    this.bot.launch();
  }
}

const main = async () => {
  const app = new App();
  try {
    await app.start();
  } catch (error) {
    console.error('Error during start:', error);
  }
};

main();
