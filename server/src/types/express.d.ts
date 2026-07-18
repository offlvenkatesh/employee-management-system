import type { Role } from "../shared/roles";

export interface AuthenticatedUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthenticatedUser;
    }
  }
}
