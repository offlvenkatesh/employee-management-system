import { describe, expect, it } from "vitest";
import { wouldCreateCircularReporting } from "./organization.service";

const records = [
  { id: "admin", reportingManager: null },
  { id: "hr", reportingManager: "admin" },
  { id: "engineer", reportingManager: "hr" },
  { id: "intern", reportingManager: "engineer" }
];

describe("wouldCreateCircularReporting", () => {
  it("detects direct circular manager assignments", () => {
    expect(wouldCreateCircularReporting("admin", "intern", records)).toBe(true);
  });

  it("allows safe manager assignments", () => {
    expect(wouldCreateCircularReporting("intern", "hr", records)).toBe(false);
  });

  it("treats null manager as safe", () => {
    expect(wouldCreateCircularReporting("hr", null, records)).toBe(false);
  });
});
