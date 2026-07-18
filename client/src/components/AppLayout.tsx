import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, LogOut, Menu, Moon, Network, Sun, UserRound, UsersRound, X } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { roleLabels } from "../types";
import { Avatar } from "./Avatar";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: UsersRound },
  { to: "/organization", label: "Hierarchy", icon: Network },
  { to: "/profile", label: "My Profile", icon: UserRound }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("ems_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ems_theme", dark ? "dark" : "light");
  }, [dark]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(217,119,87,0.16),transparent_34%),linear-gradient(135deg,#faf9f5,#f4efe8)] text-ink dark:bg-[radial-gradient(circle_at_top_left,rgba(217,119,87,0.18),transparent_35%),linear-gradient(135deg,#141413,#1f1d1a)] dark:text-paper">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-stone-200/70 bg-paper/90 px-5 py-5 backdrop-blur-xl transition dark:border-white/10 dark:bg-[#141413]/90 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-ink text-paper dark:bg-paper dark:text-ink">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">EMS</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Control Center</p>
            </div>
          </div>
          <button className="btn-secondary px-3 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                    : "text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-white/10"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="panel absolute bottom-5 left-5 right-5 p-4">
            <div className="flex items-center gap-3">
              <Avatar employee={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{user.name}</p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">{roleLabels[user.role]}</p>
              </div>
            </div>
            <button className="btn-secondary mt-4 w-full justify-center" onClick={handleLogout}>
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} /> Logout
              </span>
            </button>
          </div>
        )}
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-paper/80 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#141413]/75 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <button className="btn-secondary px-3 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div>
              <p className="label">Employee Management System</p>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">Operational people dashboard</h1>
            </div>
            <button className="btn-secondary px-3" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
