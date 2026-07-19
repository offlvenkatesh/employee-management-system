import type { AuthenticatedUser } from "../types/express";
import { config } from "../config/env";
import { getDemoOrganizationTree } from "../demo/demo-store";
import { EmployeeModel } from "../employees/employee.model";
import { toEmployeeResponse, type EmployeeResponse } from "../employees/employee.serializer";

export interface OrganizationNode extends EmployeeResponse {
  children: OrganizationNode[];
}

export interface HierarchyRecord {
  id: string;
  reportingManager: string | null;
}

export function wouldCreateCircularReporting(
  employeeId: string,
  newManagerId: string | null,
  records: HierarchyRecord[]
): boolean {
  if (!newManagerId) return false;
  const managerByEmployee = new Map(records.map((record) => [record.id, record.reportingManager]));
  const visited = new Set<string>();
  let cursor: string | null = newManagerId;

  while (cursor) {
    if (cursor === employeeId) return true;
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = managerByEmployee.get(cursor) ?? null;
  }

  return false;
}

export async function getOrganizationTree(actor: AuthenticatedUser): Promise<OrganizationNode[]> {
  if (config.demoMode) return getDemoOrganizationTree(actor);

  const employees = await EmployeeModel.find({ isDeleted: false }).sort({ name: 1 }).lean();
  const nodes = new Map<string, OrganizationNode>();

  for (const employee of employees) {
    const response = toEmployeeResponse(employee);
    nodes.set(response.id, { ...response, children: [] });
  }

  const roots: OrganizationNode[] = [];
  for (const node of nodes.values()) {
    if (node.reportingManager && nodes.has(node.reportingManager)) {
      nodes.get(node.reportingManager)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  if (actor.role === "EMPLOYEE") {
    const ownNode = nodes.get(actor.id);
    return ownNode ? [ownNode] : [];
  }

  return roots;
}
