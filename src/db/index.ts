import mongoose from 'mongoose';
import config from '../config';

export async function connectDB() {
  const connection = await mongoose.connect(config.mongodbConnString);
  return connection;
}
