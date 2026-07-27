import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

const demos = [
  { label: "Super Admin", email: "admin@ems.test", password: "Admin@123" },
  { label: "HR Manager", email: "hr@ems.test", password: "Hr@12345" },
  { label: "Employee", email: "employee@ems.test", password: "Employee@123" }
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@ems.test");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] bg-[linear-gradient(135deg,#faf9f5,#eee4d9)] text-ink dark:bg-[linear-gradient(135deg,#141413,#27231e)] dark:text-paper lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden p-10 lg:block">
        <div className="absolute inset-10 rounded-[3rem] border border-stone-200/70 bg-white/50 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.06]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm font-bold dark:border-white/10 dark:bg-white/10">
            <ShieldCheck size={18} className="text-clay" /> Secure RBAC workspace
          </div>
          <div>
            <p className="label">Employee Management System</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tighter xl:text-6xl">
              Manage people, roles, and reporting lines from one calm control room.
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-stone-600 dark:text-stone-300">
              JWT authentication, role-based access, employee CRUD, dashboard analytics, circular hierarchy prevention,
              CSV imports, and responsive operations views.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["RBAC", "Soft Delete", "Org Tree"].map((item) => (
              <div key={item} className="rounded-3xl bg-ink px-5 py-4 text-paper dark:bg-paper dark:text-ink">
                <p className="text-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-6">
        <form className="panel w-full max-w-md p-6 sm:p-8" onSubmit={handleSubmit}>
          <p className="label">Welcome back</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in to EMS</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Use one of the seeded demo accounts or any employee account you create.
          </p>

          <div className="mt-6 space-y-4">
            <label className="space-y-2">
              <span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="space-y-2">
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? "Signing in..." : "Enter dashboard"} <ArrowRight size={16} />
            </span>
          </button>

          <div className="mt-6 grid gap-2">
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm transition hover:bg-stone-50 active:scale-[0.98] dark:border-white/10 dark:hover:bg-white/10"
                onClick={() => {
                  setEmail(demo.email);
                  setPassword(demo.password);
                }}
              >
                <span className="font-bold">{demo.label}</span>
                <span className="ml-2 text-stone-500 dark:text-stone-400">{demo.email}</span>
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
