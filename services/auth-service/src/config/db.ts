import { error } from "console";
import mongoose from "mongoose";


export const connectDB = async(): Promise<void> =>{
    try{

        const mongoURI = process.env.MONGO_URI;

        if(!mongoURI){
            throw new Error("MONGO_URI is not defined in this environment variables. Check your .env file");
        }

        const connection = await mongoose.connect(mongoURI);

        console.log(`MongoDB connected:${connection.connection.host}`);
    }catch(error){
        console.error("MongoDB connection failed:",error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected',() =>{
    console.warn("MongoDB disconnected");
});

mongoose.connection.on('error',()=>{
    console.log("MongoDB connection Error",error)
})