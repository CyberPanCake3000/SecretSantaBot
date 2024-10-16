import dotenv from 'dotenv';

dotenv.config();
interface Config {
  telegramBotToken: string;
  mongodbConnString: string;
}

const config: Config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  mongodbConnString: process.env.MONGODB_CONN_STRING || '',
};

export default config;
