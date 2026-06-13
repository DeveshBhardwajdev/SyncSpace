import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import "./config/cloudinary";
import userRoutes from "./routes/user.route";

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use("/api/users", userRoutes);

app.get('/api/users/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'user-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export { app };

const PORT = process.env.PORT?.trim() || 3002;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 user-service running on port ${PORT}`);
  });
};

startServer();