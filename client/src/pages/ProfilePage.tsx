import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";
import type { Employee } from "../types";
import { roleLabels } from "../types";
import { Avatar } from "../components/Avatar";
import { ErrorBanner } from "../components/ErrorBanner";
import { RoleBadge, StatusBadge } from "../components/Badges";

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await api.get<{ data: Employee }>(`/api/employees/${user!.id}`);
      setPhone(response.data.phone);
      setProfileImage(response.data.profileImage);
      return response.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: () => api.put<{ data: Employee }>(`/api/employees/${user!.id}`, { phone, profileImage }),
    onSuccess: async () => {
      setNotice("Profile updated.");
      await refreshMe();
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    }
  });

  if (profileQuery.isLoading) return <div className="skeleton h-96" />;
  if (profileQuery.error) return <ErrorBanner error={profileQuery.error} />;
  const profile = profileQuery.data!;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="panel p-6">
        <Avatar employee={{ ...profile, profileImage }} size="lg" />
        <h2 className="mt-5 text-3xl font-black tracking-tight">{profile.name}</h2>
        <p className="mt-2 text-stone-500 dark:text-stone-400">{profile.designation} · {profile.department}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <RoleBadge role={profile.role} />
          <StatusBadge status={profile.status} />
        </div>
        <dl className="mt-8 space-y-4 text-sm">
          <Info label="Employee ID" value={profile.employeeId} />
          <Info label="Email" value={profile.email} />
          <Info label="Role" value={roleLabels[profile.role]} />
          <Info label="Joining date" value={new Date(profile.joiningDate).toLocaleDateString()} />
        </dl>
      </section>

      <section className="panel p-6">
        <p className="label">Limited self-service edit</p>
        <h2 className="text-2xl font-black tracking-tight">Update contact details</h2>
        <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          Employees can only edit their own phone number and profile image. Role, salary, manager, and employment fields stay under HR/Super Admin control.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="label">Phone</span>
            <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="label">Profile image URL</span>
            <input className="input" value={profileImage} onChange={(event) => setProfileImage(event.target.value)} />
          </label>
        </div>
        {notice && <p className="mt-4 rounded-2xl bg-moss/10 px-4 py-3 text-sm font-semibold text-moss dark:text-green-200">{notice}</p>}
        {saveMutation.error && <div className="mt-4"><ErrorBanner error={saveMutation.error} /></div>}
        <button className="btn-primary mt-6" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <span className="inline-flex items-center gap-2"><Save size={16} /> {saveMutation.isPending ? "Saving..." : "Save profile"}</span>
        </button>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
