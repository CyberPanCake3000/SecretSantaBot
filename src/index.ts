import {connectDB} from './db';
import {bot} from './bot';

console.log(connectDB());
console.log(bot.launch());
