import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 3001;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Auth Service is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start Auth Service:", error);
    process.exit(1);
  }
};

startServer();