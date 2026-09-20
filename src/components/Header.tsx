import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { signOut } from "@/app/login/actions";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = user ? await isAdminUser(user.id) : false;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-2xl font-bold tracking-tight text-transparent"
        >
          Venus
        </Link>

        <div className="hidden flex-1 justify-center sm:flex">
          <Link
            href="/search"
            className="w-full max-w-sm rounded-full border border-white/10 bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground"
          >
            Search movies &amp; TV shows...
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/search" className="sm:hidden">
            Search
          </Link>
          {admin && (
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          )}
          {user && (
            <form action={signOut}>
              <button type="submit" className="transition-colors hover:text-foreground">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
