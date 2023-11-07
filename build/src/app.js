"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const TelegramBot_1 = require("./bot/TelegramBot");
class App {
    constructor() {
        this.configService = new config_1.default();
        this.bot = new TelegramBot_1.default(this.configService.get('TG_APIKEY'));
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
//# sourceMappingURL=app.js.map