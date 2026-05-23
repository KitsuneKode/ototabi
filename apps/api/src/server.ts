import app from "@/app";
import config from "@/utils/config";
import { logger } from "@/utils/logger";

const port = config.getConfig("port");

const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

const gracefulShutdown = () => {
  logger.info("Shutdown signal received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced exit after shutdown timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
