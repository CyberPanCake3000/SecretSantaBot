import mongoose from 'mongoose';

class MongoConnect {
  urlString: string;

  constructor(urlString: string) {
    this.urlString = urlString;
  }

  async connect() {
    mongoose.connect(this.urlString);

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      console.log('Connected to MongoDB');
    });
    return db;
  }
}

export default MongoConnect;
