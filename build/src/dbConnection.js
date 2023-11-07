"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
class MongoConnect {
    constructor(urlString) {
        this.urlString = urlString;
    }
    async connect() {
        mongoose_1.default.connect(this.urlString);
        const db = mongoose_1.default.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
        db.once('open', () => {
            console.log('Connected to MongoDB');
        });
        return db;
    }
}
exports.default = MongoConnect;
//# sourceMappingURL=dbConnection.js.map