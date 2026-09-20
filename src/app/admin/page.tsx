import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AddUserForm from "@/components/admin/AddUserForm";
import CsvImportForm from "@/components/admin/CsvImportForm";

export const metadata: Metadata = { title: "Admin — Venus" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin</h1>
      <p className="mt-1 text-sm text-muted">Provision customer accounts directly.</p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Add a single user</h2>
        <AddUserForm />
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Bulk import from CSV</h2>
        <p className="mb-3 text-sm text-muted">
          Columns: <code className="rounded bg-surface px-1.5 py-0.5">email,password</code>.{" "}
          <a href="/sample-users.csv" download className="text-accent hover:underline">
            Download a sample CSV
          </a>
          .
        </p>
        <CsvImportForm />
      </section>
    </div>
  );
}
