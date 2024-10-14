import {connectDB} from './db';
import {bot} from './bot';

connectDB();
bot.launch();
