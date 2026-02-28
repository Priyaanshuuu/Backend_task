import mongoose from "mongoose";

const MONGODB_URL   = process.env.MONGODB_URL
if(!MONGODB_URL){
    throw new Error("Something wrong with the mongoDB url")
}

interface MongooseCache {
    conn : typeof mongoose
    promise : Promise<typeof mongoose>
}

declare global {
    var __mongooseCache : MongooseCache
}

const cache : MongooseCache = global.__mongooseCache 
global.__mongooseCache = cache

export async function connectDB(): Promise<typeof mongoose>{
    if(cache.conn) return cache.conn
    if(!cache.promise){
        cache.promise = mongoose.connect(MONGODB_URL! , {
            bufferCommands : false,
            maxPoolSize : 10,
            serverSelectionTimeoutMS : 5000,
            socketTimeoutMS : 4500,
        })
    try {
        cache.conn = await cache.promise;
    } catch (error) {
        throw error
        
    }
    }
    return cache.conn
}