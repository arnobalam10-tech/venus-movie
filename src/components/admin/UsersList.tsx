import { createAdminClient } from "@/lib/supabase/admin";

interface CredentialRow {
  user_id: string;
  password: string;
}

export default async function UsersList() {
  let users: { id: string; email: string; createdAt: string }[] = [];
  let passwordByUserId = new Map<string, string>();

  try {
    const supabase = createAdminClient();

    const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    users = (userList?.users ?? [])
      .map((u) => ({ id: u.id, email: u.email ?? "—", createdAt: u.created_at }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const { data: creds } = await supabase
      .from("admin_created_credentials")
      .select("user_id, password")
      .returns<CredentialRow[]>();
    passwordByUserId = new Map((creds ?? []).map((c) => [c.user_id, c.password]));
  } catch {
    return <p className="text-sm text-muted">Couldn&apos;t load the user list.</p>;
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted">No users yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs text-muted">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Password</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const password = passwordByUserId.get(u.id);
            return (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-3 py-2 text-foreground">{u.email}</td>
                <td className="px-3 py-2 font-mono text-foreground">
                  {password ?? <span className="font-sans text-muted">—</span>}
                </td>
                <td className="px-3 py-2 text-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
