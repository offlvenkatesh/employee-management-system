import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Employee, EmployeeStatus, Role } from "../types";
import { roleLabels, statusLabels } from "../types";

export interface EmployeeFormValues {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
  role: Role;
  reportingManager: string | null;
  profileImage: string;
  password?: string;
}

interface Props {
  employee: Employee | null;
  managers: Employee[];
  currentUserRole: Role;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
}

const defaultValues: EmployeeFormValues = {
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  salary: 50000,
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  role: "EMPLOYEE",
  reportingManager: null,
  profileImage: "",
  password: ""
};

export function EmployeeFormModal({ employee, managers, currentUserRole, isSubmitting, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<EmployeeFormValues>(defaultValues);

  useEffect(() => {
    if (!employee) {
      setValues(defaultValues);
      return;
    }
    setValues({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      salary: employee.salary,
      joiningDate: employee.joiningDate.slice(0, 10),
      status: employee.status,
      role: employee.role,
      reportingManager: employee.reportingManager,
      profileImage: employee.profileImage,
      password: ""
    });
  }, [employee]);

  const roleOptions: Role[] = currentUserRole === "SUPER_ADMIN" ? ["SUPER_ADMIN", "HR_MANAGER", "EMPLOYEE"] : ["HR_MANAGER", "EMPLOYEE"];

  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ ...values, password: values.password || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm dark:bg-black/50">
      <form className="panel max-h-[92dvh] w-full max-w-4xl overflow-auto p-5 sm:p-6" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label">Employee record</p>
            <h2 className="text-2xl font-black tracking-tight">{employee ? "Edit employee" : "Create employee"}</h2>
          </div>
          <button type="button" className="btn-secondary px-3" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Employee ID">
            <input className="input" value={values.employeeId} onChange={(event) => update("employeeId", event.target.value)} required />
          </Field>
          <Field label="Full name">
            <input className="input" value={values.name} onChange={(event) => update("name", event.target.value)} required />
          </Field>
          <Field label="Email">
            <input className="input" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} required />
          </Field>
          <Field label="Phone">
            <input className="input" value={values.phone} onChange={(event) => update("phone", event.target.value)} required />
          </Field>
          <Field label="Department">
            <input className="input" value={values.department} onChange={(event) => update("department", event.target.value)} required />
          </Field>
          <Field label="Designation">
            <input className="input" value={values.designation} onChange={(event) => update("designation", event.target.value)} required />
          </Field>
          <Field label="Salary">
            <input
              className="input"
              type="number"
              min="1"
              value={values.salary}
              onChange={(event) => update("salary", Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Joining date">
            <input
              className="input"
              type="date"
              value={values.joiningDate}
              onChange={(event) => update("joiningDate", event.target.value)}
              required
            />
          </Field>
          <Field label="Status">
            <select className="input" value={values.status} onChange={(event) => update("status", event.target.value as EmployeeStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role">
            <select className="input" value={values.role} onChange={(event) => update("role", event.target.value as Role)}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reporting manager">
            <select
              className="input"
              value={values.reportingManager ?? ""}
              onChange={(event) => update("reportingManager", event.target.value || null)}
            >
              <option value="">No manager</option>
              {managers
                .filter((manager) => manager.id !== employee?.id)
                .map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.employeeId})
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Profile image URL">
            <input className="input" value={values.profileImage} onChange={(event) => update("profileImage", event.target.value)} />
          </Field>
          <Field label={employee ? "New password (optional)" : "Password (optional)"}>
            <input
              className="input"
              type="password"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Default is Welcome@123"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : employee ? "Save changes" : "Create employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
