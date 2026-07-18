import bcrypt from "bcryptjs";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { EmployeeModel } from "../employees/employee.model";
import type { Role } from "../shared/roles";

interface SeedEmployee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
  role: Role;
  managerEmployeeId?: string;
  password: string;
}

const employees: SeedEmployee[] = [
  {
    employeeId: "EMS-0001",
    name: "Anika Rao",
    email: "admin@ems.test",
    phone: "+1 555 0100",
    department: "Executive",
    designation: "Chief Operating Officer",
    salary: 240000,
    joiningDate: "2020-01-10",
    status: "ACTIVE",
    role: "SUPER_ADMIN",
    password: "Admin@123"
  },
  {
    employeeId: "EMS-0002",
    name: "Marcus Lee",
    email: "hr@ems.test",
    phone: "+1 555 0101",
    department: "People Operations",
    designation: "HR Manager",
    salary: 135000,
    joiningDate: "2021-03-15",
    status: "ACTIVE",
    role: "HR_MANAGER",
    managerEmployeeId: "EMS-0001",
    password: "Hr@12345"
  },
  {
    employeeId: "EMS-0003",
    name: "Priya Menon",
    email: "employee@ems.test",
    phone: "+1 555 0102",
    department: "Engineering",
    designation: "Frontend Engineer",
    salary: 118000,
    joiningDate: "2022-06-20",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: "Employee@123"
  },
  {
    employeeId: "EMS-0004",
    name: "Noah Patel",
    email: "noah@ems.test",
    phone: "+1 555 0103",
    department: "Engineering",
    designation: "Backend Engineer",
    salary: 124000,
    joiningDate: "2022-09-05",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: config.defaultEmployeePassword
  },
  {
    employeeId: "EMS-0005",
    name: "Sofia Chen",
    email: "sofia@ems.test",
    phone: "+1 555 0104",
    department: "Finance",
    designation: "Finance Analyst",
    salary: 98000,
    joiningDate: "2023-02-13",
    status: "ACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0001",
    password: config.defaultEmployeePassword
  },
  {
    employeeId: "EMS-0006",
    name: "Ethan Carter",
    email: "ethan@ems.test",
    phone: "+1 555 0105",
    department: "Sales",
    designation: "Account Executive",
    salary: 105000,
    joiningDate: "2023-11-01",
    status: "INACTIVE",
    role: "EMPLOYEE",
    managerEmployeeId: "EMS-0002",
    password: config.defaultEmployeePassword
  }
];

export async function seedEmployees(): Promise<void> {
  const employeeIds = new Map<string, string>();

  for (const employee of employees) {
    const existing = await EmployeeModel.findOne({ employeeId: employee.employeeId }).select("_id").lean();
    if (existing) {
      employeeIds.set(employee.employeeId, String(existing._id));
      continue;
    }

    const passwordHash = await bcrypt.hash(employee.password, 12);
    const created = await EmployeeModel.create({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      salary: employee.salary,
      joiningDate: new Date(employee.joiningDate),
      status: employee.status,
      role: employee.role,
      passwordHash,
      reportingManager: null
    });
    employeeIds.set(employee.employeeId, String(created._id));
  }

  for (const employee of employees) {
    if (!employee.managerEmployeeId) continue;
    const employeeObjectId = employeeIds.get(employee.employeeId);
    const managerObjectId = employeeIds.get(employee.managerEmployeeId);
    if (!employeeObjectId || !managerObjectId) continue;
    await EmployeeModel.updateOne({ _id: employeeObjectId }, { $set: { reportingManager: managerObjectId } });
  }

  logger.info("Seed employees are available");
}
