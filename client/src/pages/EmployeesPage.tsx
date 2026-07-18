import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, Upload } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";
import type { Employee, EmployeeStatus, PaginatedResponse, Role } from "../types";
import { roleLabels, statusLabels } from "../types";
import { Avatar } from "../components/Avatar";
import { RoleBadge, StatusBadge } from "../components/Badges";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { EmployeeFormModal, type EmployeeFormValues } from "../components/EmployeeFormModal";

export function EmployeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<"joiningDate" | "name">("joiningDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "10", sortBy, sortOrder });
    if (search) params.set("search", search);
    if (department) params.set("department", department);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    return params.toString();
  }, [department, page, role, search, sortBy, sortOrder, status]);

  const employeesQuery = useQuery({
    queryKey: ["employees", queryString],
    queryFn: () => api.get<PaginatedResponse<Employee>>(`/api/employees?${queryString}`)
  });

  const managerQuery = useQuery({
    queryKey: ["employees", "managers"],
    queryFn: () => api.get<PaginatedResponse<Employee>>("/api/employees?limit=100&sortBy=name&sortOrder=asc")
  });

  const saveMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      editingEmployee
        ? api.put<{ data: Employee }>(`/api/employees/${editingEmployee.id}`, values)
        : api.post<{ data: Employee }>("/api/employees", values),
    onSuccess: () => {
      setModalOpen(false);
      setEditingEmployee(null);
      setNotice("Employee record saved.");
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/employees/${id}`),
    onSuccess: () => {
      setNotice("Employee was deactivated and soft deleted.");
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.postForm<{ created: number; failed: { row: number; reason: string }[] }>("/api/employees/import", form);
    },
    onSuccess: (result) => {
      setNotice(`CSV import created ${result.created} employee(s), ${result.failed.length} failed.`);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  const employees = employeesQuery.data?.data ?? [];
  const meta = employeesQuery.data?.meta;
  const departments = Array.from(new Set((managerQuery.data?.data ?? employees).map((employee) => employee.department))).sort();
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "HR_MANAGER";
  const canDelete = user?.role === "SUPER_ADMIN";

  function openCreate() {
    setEditingEmployee(null);
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditingEmployee(employee);
    setModalOpen(true);
  }

  function handleDelete(employee: Employee) {
    if (!window.confirm(`Soft delete ${employee.name}?`)) return;
    deleteMutation.mutate(employee.id);
  }

  function downloadCsvTemplate() {
    const csv = "employeeId,name,email,phone,department,designation,salary,joiningDate,status,role,password\nEMS-0100,Alex Morgan,alex@example.com,+1 555 0199,Engineering,QA Engineer,90000,2024-01-15,ACTIVE,EMPLOYEE,Welcome@123\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ems-employee-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="label">Employee operations</p>
            <h2 className="text-2xl font-black tracking-tight">Search, filter, sort, and manage records</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-secondary" onClick={downloadCsvTemplate}>
              <span className="inline-flex items-center gap-2"><Download size={16} /> CSV template</span>
            </button>
            {canManage && (
              <label className="btn-secondary cursor-pointer">
                <span className="inline-flex items-center gap-2"><Upload size={16} /> Import CSV</span>
                <input
                  className="hidden"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importMutation.mutate(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            )}
            {canManage && (
              <button className="btn-primary" onClick={openCreate}>
                <span className="inline-flex items-center gap-2"><Plus size={16} /> New employee</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              className="input pl-11"
              placeholder="Search name or email"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
          </label>
          <select className="input" value={department} onChange={(event) => { setPage(1); setDepartment(event.target.value); }}>
            <option value="">All departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="input" value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }}>
            <option value="">All roles</option>
            {(Object.keys(roleLabels) as Role[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
          </select>
          <select className="input" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
            <option value="">All statuses</option>
            {(Object.keys(statusLabels) as EmployeeStatus[]).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
          </select>
          <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value as "joiningDate" | "name")}>
            <option value="joiningDate">Sort by joining date</option>
            <option value="name">Sort by name</option>
          </select>
          <select className="input" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </section>

      {notice && <p className="rounded-3xl border border-moss/20 bg-moss/10 px-5 py-4 text-sm font-semibold text-moss dark:text-green-200">{notice}</p>}
      {(saveMutation.error || deleteMutation.error || importMutation.error) && (
        <ErrorBanner error={saveMutation.error ?? deleteMutation.error ?? importMutation.error} />
      )}
      {employeesQuery.error && <ErrorBanner error={employeesQuery.error} />}

      {employeesQuery.isLoading ? (
        <EmployeesSkeleton />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" description="Try a broader search, clear filters, or create a new employee record." />
      ) : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-stone-200/70 text-xs uppercase tracking-[0.14em] text-stone-500 dark:border-white/10 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Manager</th>
                  <th className="px-5 py-4">Joining</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 dark:divide-white/10">
                {employees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-stone-50/70 dark:hover:bg-white/[0.04]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar employee={employee} />
                        <div>
                          <p className="font-black">{employee.name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{employee.employeeId} · {employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{employee.department}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{employee.designation}</p>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={employee.role} /></td>
                    <td className="px-5 py-4"><StatusBadge status={employee.status} /></td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">{employee.reportingManagerName ?? "None"}</td>
                    <td className="px-5 py-4">{new Date(employee.joiningDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {(canManage || user?.id === employee.id) && <button className="btn-secondary" onClick={() => openEdit(employee)}>Edit</button>}
                        {canDelete && employee.id !== user?.id && <button className="btn-danger" onClick={() => handleDelete(employee)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && (
            <div className="flex flex-col gap-3 border-t border-stone-200/70 px-5 py-4 text-sm dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-stone-500 dark:text-stone-400">Page {meta.page} of {meta.totalPages} · {meta.total} records</p>
              <div className="flex gap-2">
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                <button className="btn-secondary" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
              </div>
            </div>
          )}
        </section>
      )}

      {isModalOpen && user && (
        <EmployeeFormModal
          employee={editingEmployee}
          managers={managerQuery.data?.data ?? []}
          currentUserRole={user.role}
          isSubmitting={saveMutation.isPending}
          onClose={() => {
            setModalOpen(false);
            setEditingEmployee(null);
          }}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      )}
    </div>
  );
}

function EmployeesSkeleton() {
  return (
    <div className="panel p-5">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-stone-200/70 py-4 last:border-b-0 dark:border-white/10">
          <div className="skeleton size-12" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-44" />
            <div className="skeleton h-3 w-72" />
          </div>
          <div className="skeleton h-9 w-24" />
        </div>
      ))}
    </div>
  );
}
