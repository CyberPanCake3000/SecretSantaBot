import {Telegraf, Context} from 'telegraf';
import MongoConnect from '../dbConnection';

export interface SessionData {
  userId: number | undefined;
  selectedEvent: Event | null;
  role: string;
  currentMessage: number;
  currentPage: number;
}

export interface BotContext extends Context {
  session: SessionData;
}

class TelegramBot extends Telegraf<BotContext> {
  db: MongoConnect;

  constructor(token: string, mongoUrl: string) {
    super(token);
    this.db = new MongoConnect(mongoUrl);
    this.db.connect();
  }
}

export default TelegramBot;
