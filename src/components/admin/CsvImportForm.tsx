"use client";

import { useActionState } from "react";
import { importCsv, type ImportCsvState } from "@/app/admin/actions";

const initialState: ImportCsvState = { status: "idle" };

export default function CsvImportForm() {
  const [state, formAction, pending] = useActionState(importCsv, initialState);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:text-foreground"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {state.message && (
        <p
          className={`mt-3 text-sm ${state.status === "error" ? "text-red-300" : "text-muted"}`}
        >
          {state.message}
        </p>
      )}

      {state.results && state.results.length > 0 && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {state.results.map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-3 py-2 text-foreground">{r.email}</td>
                  <td
                    className={`px-3 py-2 font-medium ${
                      r.status === "created"
                        ? "text-emerald-300"
                        : r.status === "skipped"
                          ? "text-amber-300"
                          : "text-red-300"
                    }`}
                  >
                    {r.status}
                  </td>
                  <td className="px-3 py-2 text-muted">{r.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
