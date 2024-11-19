import dotenv from 'dotenv';

dotenv.config();
interface Config {
  telegramBotToken: string;
  mongodbConnString: string;
  telegramApiAppId: string;
  telegramApiAppHash: string;
}

const config: Config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  mongodbConnString: process.env.MONGODB_CONN_STRING || '',
  telegramApiAppId: process.env.TELEGRAM_API_APP_ID || '',
  telegramApiAppHash: process.env.TELEGRAM_API_APP_HASH || '',
};

export default config;
