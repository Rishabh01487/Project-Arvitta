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