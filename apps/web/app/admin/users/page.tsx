"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { useRequireAdmin } from "@/lib/use-require-admin";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  purchases: Array<{ plan: { name: string } }>;
  progress: unknown[];
};

export default function AdminUsersPage() {
  const ready = useRequireAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  async function load() {
    setUsers(await api<User[]>("/admin/users"));
  }

  useEffect(() => {
    if (ready) void load();
  }, [ready]);

  if (!ready) return null;

  async function toggle(user: User) {
    await api(`/admin/users/${user.id}/active`, { method: "PATCH", json: { active: !user.active } });
    await load();
  }

  const filtered = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">User Management</h1>
        <input className="w-full rounded-md border border-line px-3 py-2 sm:w-80" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Plans</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.purchases.map((purchase) => purchase.plan.name).join(", ") || "None"}</td>
                  <td className="px-4 py-3">{user.progress.length} tasks</td>
                  <td className="px-4 py-3">{user.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3"><Button variant="secondary" onClick={() => toggle(user)}>{user.active ? "Deactivate" : "Activate"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
