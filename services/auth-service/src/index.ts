import express, { Application,Request,Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dotenv from 'dotenv';

dotenv.config();

import { connectDB } from "./config/db";
import authRoutes from './routes/auth.routes';


const app: Application = express();


app.use(helmet());

app.use(cors());

app.use(morgan('dev'));

app.use(express.json())

app.use(express.urlencoded({extended:true}));

app.get('/health',(req:Request, res:Response)=>{
    res.status(200).json({
        status: 'ok',
        service: 'auth-service',
        timeStamp: new Date().toISOString(),
    });
});

app.use('/api/auth',authRoutes);

app.use((req:Request , res:Response)=>{
    res.status(404).json({
        success:false,
        message : `Routes ${req.method} ${req.url} not found`,
    });
});


const PORT = process.env.PORT || 3001;

const startServer = async(): Promise<void> =>{
    try{
        await connectDB();

        app.listen(PORT , ()=>{
            console.log(`Auth Service is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }catch(error){
        console.error("Failed to start Auth Service:",error);
        process.exit(1);
    }
};

startServer();