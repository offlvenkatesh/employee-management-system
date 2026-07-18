import type { Employee } from "../types";

export function Avatar({ employee, size = "md" }: { employee: Pick<Employee, "name" | "profileImage">; size?: "sm" | "md" | "lg" }) {
  const initials = employee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizes = { sm: "size-9 text-xs", md: "size-12 text-sm", lg: "size-16 text-lg" };

  if (employee.profileImage) {
    return (
      <img
        src={employee.profileImage}
        alt={employee.name}
        className={`${sizes[size]} rounded-2xl object-cover ring-1 ring-stone-200 dark:ring-white/10`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-2xl bg-moss/15 font-black text-moss dark:bg-moss/25`}>
      {initials}
    </div>
  );
}
