import mongoose from 'mongoose'

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var pfMongoose: CachedConnection | undefined
}

let cached = global.pfMongoose
if (!cached) {
  cached = global.pfMongoose = { conn: null, promise: null }
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('MONGODB_URI not defined in .env.local')
  if (!cached) throw new Error('Cache not initialized')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }).then((m) => m)