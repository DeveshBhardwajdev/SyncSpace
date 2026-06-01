import mongoose from "mongoose";

export const connectDB = async(): Promise<void> => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if(!MONGODB_URI){
            throw new Error("MONGODB_URI is not defined in environment variables. Check your .env file");
        }

        const connection = await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB connected: ${connection.connection.host}`);

    } catch(error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn("MongoDB disconnected");
});

mongoose.connection.on('error', (err) => {
    console.error("MongoDB connection error:", err);
});