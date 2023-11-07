"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
class ConfigService {
    constructor() {
        const { error, parsed } = (0, dotenv_1.config)();
        if (error) {
            throw new Error('File .env not found.');
        }
        if (!parsed) {
            throw new Error('File .env is empty.');
        }
        this.config = parsed;
    }
    get(key) {
        const res = this.config[key];
        if (!res) {
            throw new Error('No key in .env.');
        }
        return res;
    }
}
exports.default = ConfigService;
//# sourceMappingURL=config.js.map