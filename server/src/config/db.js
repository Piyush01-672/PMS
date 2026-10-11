import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

let connectionPromise = null;

export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!connectionPromise || mongoose.connection.readyState === 0) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }
  try {
    await connectionPromise;
  } catch (err) {
    connectionPromise = null;
    throw err;
  }
  return mongoose.connection;
}

export async function disconnectDB() {
  connectionPromise = null;
  await mongoose.disconnect();
}
