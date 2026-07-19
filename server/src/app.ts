import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config/env";
import { isDatabaseReady } from "./config/database";
import { authRoutes } from "./auth/auth.routes";
import { dashboardRoutes } from "./dashboard/dashboard.routes";
import { employeeRoutes } from "./employees/employee.routes";
import { organizationRoutes } from "./organization/organization.routes";
import { errorHandler, notFoundHandler } from "./shared/error.middleware";
import { requestIdMiddleware } from "./shared/request-id.middleware";
import { requestLogger } from "./shared/request-logger.middleware";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) =>
    res.json({
      name: "Employee Management System API",
      status: "ok",
      docs: "https://github.com/offlvenkatesh/employee-management-system/blob/main/docs/API.md",
      endpoints: {
        health: "/health",
        ready: "/ready",
        auth: "/api/auth/login",
        employees: "/api/employees",
        dashboard: "/api/dashboard/stats",
        organization: "/api/organization/tree"
      }
    })
  );
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/ready", (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "degraded", checks: { database: ready } });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/organization", organizationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
