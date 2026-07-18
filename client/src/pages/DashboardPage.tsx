import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, UserCheck, UserX, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import type { DashboardStats } from "../types";
import { roleLabels } from "../types";
import { Avatar } from "../components/Avatar";
import { ErrorBanner } from "../components/ErrorBanner";
import { RoleBadge, StatusBadge } from "../components/Badges";

const colors = ["#d97757", "#6a9bcc", "#788c5d"];

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<{ data: DashboardStats }>("/api/dashboard/stats")
  });

  if (statsQuery.isLoading) return <DashboardSkeleton />;
  if (statsQuery.error) return <ErrorBanner error={statsQuery.error} />;

  const stats = statsQuery.data!.data;
  const statusData = [
    { name: "Active", value: stats.activeEmployees },
    { name: "Inactive", value: stats.inactiveEmployees }
  ];
  const roleData = stats.roleBreakdown.map((item) => ({ name: roleLabels[item.role], value: item.count }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} label="Total Employees" value={stats.totalEmployees} tone="bg-ink text-paper dark:bg-paper dark:text-ink" />
        <MetricCard icon={UserCheck} label="Active Employees" value={stats.activeEmployees} tone="bg-moss/15 text-moss" />
        <MetricCard icon={UserX} label="Inactive Employees" value={stats.inactiveEmployees} tone="bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-200" />
        <MetricCard icon={Building2} label="Departments" value={stats.departmentCount} tone="bg-clay/15 text-clay" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label">Role distribution</p>
              <h2 className="text-xl font-black tracking-tight">Access footprint</h2>
            </div>
            <Activity className="text-clay" />
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(120,120,120,0.2)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(217,119,87,0.08)" }} />
                <Bar dataKey="value" radius={[16, 16, 4, 4]} fill="#d97757" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="label">Status mix</p>
          <h2 className="text-xl font-black tracking-tight">Workforce health</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={6}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200/70 p-5 dark:border-white/10 sm:p-6">
          <p className="label">Recently joined</p>
          <h2 className="text-xl font-black tracking-tight">Latest employee records</h2>
        </div>
        <div className="divide-y divide-stone-200/70 dark:divide-white/10">
          {stats.recentEmployees.map((employee) => (
            <div key={employee.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-6">
              <div className="flex items-center gap-3">
                <Avatar employee={employee} />
                <div>
                  <p className="font-black">{employee.name}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{employee.designation} · {employee.department}</p>
                </div>
              </div>
              <RoleBadge role={employee.role} />
              <StatusBadge status={employee.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof UsersRound; label: string; value: number; tone: string }) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className={`grid size-12 place-items-center rounded-2xl ${tone}`}>
        <Icon size={21} />
      </div>
      <p className="mt-6 text-4xl font-black tracking-tighter">{value}</p>
      <p className="mt-2 text-sm font-semibold text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel p-6">
            <div className="skeleton size-12" />
            <div className="skeleton mt-6 h-10 w-24" />
            <div className="skeleton mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="skeleton h-96" />
    </div>
  );
}
