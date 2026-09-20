"use client";

import { useActionState } from "react";
import { addUser, type AddUserState } from "@/app/admin/actions";

const initialState: AddUserState = { status: "idle" };

export default function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUser, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="add-user-email" className="text-xs font-medium text-muted">
          Email
        </label>
        <input
          id="add-user-email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          placeholder="customer@example.com"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="add-user-password" className="text-xs font-medium text-muted">
          Password
        </label>
        <input
          id="add-user-password"
          name="password"
          type="text"
          required
          minLength={6}
          className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          placeholder="At least 6 characters"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add user"}
      </button>

      {state.status !== "idle" && (
        <p
          className={`text-sm sm:basis-full ${
            state.status === "success" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
