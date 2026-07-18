import { Schema, Types, model } from "mongoose";
import { ROLES, STATUSES, type EmployeeStatus, type Role } from "../shared/roles";

export interface Employee {
  _id: Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: EmployeeStatus;
  role: Role;
  reportingManager?: Types.ObjectId | null;
  profileImage?: string;
  passwordHash: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<Employee>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true, index: true },
    status: { type: String, enum: STATUSES, default: "ACTIVE", index: true },
    role: { type: String, enum: ROLES, default: "EMPLOYEE", index: true },
    reportingManager: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    profileImage: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, select: false },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

employeeSchema.index({ name: "text", email: "text" });

export const EmployeeModel = model<Employee>("Employee", employeeSchema);
