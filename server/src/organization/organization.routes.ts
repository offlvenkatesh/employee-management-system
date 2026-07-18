import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { organizationTreeController } from "./organization.controller";

export const organizationRoutes = Router();

organizationRoutes.use(authenticate);
organizationRoutes.get("/tree", organizationTreeController);
