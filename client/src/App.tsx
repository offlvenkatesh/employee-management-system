import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./providers/AuthProvider";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { ProfilePage } from "./pages/ProfilePage";

function ProtectedRoute() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <BootScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function BootScreen() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper text-ink dark:bg-[#141413] dark:text-paper">
      <div className="panel w-[min(420px,calc(100vw-2rem))] p-8">
        <div className="skeleton h-5 w-28" />
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/organization" element={<OrganizationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
