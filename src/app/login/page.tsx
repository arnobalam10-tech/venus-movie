import { signIn } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-center text-3xl font-bold text-transparent">
          Venus
        </h1>
        <p className="mb-8 text-center text-sm text-muted">Sign in to keep watching.</p>

        <div className="rounded-2xl border border-white/10 bg-surface p-6 shadow-xl">
          {params.error && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {params.error}
            </p>
          )}
          {params.message && (
            <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {params.message}
            </p>
          )}

          <form action={signIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-muted">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                placeholder="••••••••"
              />
            </div>

            <SubmitButton
              pendingLabel="Signing in..."
              className="mt-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              Sign in
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Accounts are created by the site admin. Contact us if you need access.
        </p>
      </div>
    </div>
  );
}
