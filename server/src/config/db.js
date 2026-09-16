import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB(uri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
