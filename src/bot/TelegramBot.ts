import {Telegraf, Context} from 'telegraf';

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
  constructor(token: string) {
    super(token);
  }
}

export default TelegramBot;
