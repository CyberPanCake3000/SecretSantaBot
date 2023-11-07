import mongoose from 'mongoose';
declare class MongoConnect {
    urlString: string;
    constructor(urlString: string);
    connect(): Promise<mongoose.Connection>;
}
export default MongoConnect;
