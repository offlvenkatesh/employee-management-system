import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network } from "lucide-react";
import { api } from "../lib/api";
import type { Employee, OrganizationNode } from "../types";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { RoleBadge, StatusBadge } from "../components/Badges";

export function OrganizationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const treeQuery = useQuery({
    queryKey: ["organization-tree"],
    queryFn: () => api.get<{ data: OrganizationNode[] }>("/api/organization/tree")
  });

  const reporteesQuery = useQuery({
    queryKey: ["reportees", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => api.get<{ data: Employee[] }>(`/api/employees/${selectedId}/reportees`)
  });

  if (treeQuery.isLoading) return <div className="skeleton h-[520px]" />;
  if (treeQuery.error) return <ErrorBanner error={treeQuery.error} />;
  const roots = treeQuery.data?.data ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-clay/15 text-clay">
            <Network />
          </div>
          <div>
            <p className="label">Organizational hierarchy</p>
            <h2 className="text-2xl font-black tracking-tight">Reporting tree</h2>
          </div>
        </div>
        <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          Managers can be assigned from the employee editor. The API prevents circular reporting chains before saving.
        </p>

        <div className="mt-6 space-y-4">
          {roots.length === 0 ? (
            <EmptyState title="No hierarchy yet" description="Create employees and assign reporting managers to populate the tree." />
          ) : (
            roots.map((node) => <OrgNodeCard key={node.id} node={node} selectedId={selectedId} onSelect={setSelectedId} depth={0} />)
          )}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <p className="label">Direct reports</p>
        <h2 className="text-2xl font-black tracking-tight">Selected manager view</h2>
        {!selectedId ? (
          <p className="mt-4 text-sm leading-relaxed text-stone-500 dark:text-stone-400">Select any employee in the tree to inspect their direct reports.</p>
        ) : reporteesQuery.isLoading ? (
          <div className="mt-6 space-y-3">
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
          </div>
        ) : reporteesQuery.error ? (
          <div className="mt-4"><ErrorBanner error={reporteesQuery.error} /></div>
        ) : reporteesQuery.data?.data.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-stone-100 px-5 py-4 text-sm text-stone-600 dark:bg-white/10 dark:text-stone-300">No direct reports for this employee.</p>
        ) : (
          <div className="mt-6 divide-y divide-stone-200/70 dark:divide-white/10">
            {reporteesQuery.data?.data.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar employee={employee} />
                  <div>
                    <p className="font-black">{employee.name}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{employee.designation}</p>
                  </div>
                </div>
                <StatusBadge status={employee.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrgNodeCard({ node, selectedId, onSelect, depth }: { node: OrganizationNode; selectedId: string | null; onSelect: (id: string) => void; depth: number }) {
  return (
    <div className="relative" style={{ marginLeft: depth ? Math.min(depth * 24, 96) : 0 }}>
      {depth > 0 && <div className="absolute -left-4 top-6 h-px w-4 bg-stone-300 dark:bg-white/20" />}
      <button
        className={`w-full rounded-3xl border p-4 text-left transition active:scale-[0.99] ${
          selectedId === node.id
            ? "border-clay bg-clay/10"
            : "border-stone-200 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/10"
        }`}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar employee={node} />
            <div>
              <p className="font-black">{node.name}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{node.designation} · {node.department}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <RoleBadge role={node.role} />
            <StatusBadge status={node.status} />
          </div>
        </div>
      </button>
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3 border-l border-stone-300 pl-4 dark:border-white/20">
          {node.children.map((child) => (
            <OrgNodeCard key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
