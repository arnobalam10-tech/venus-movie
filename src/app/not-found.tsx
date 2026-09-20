import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-3xl font-bold text-transparent">
        Not found
      </h1>
      <p className="max-w-sm text-sm text-muted">
        We couldn&apos;t find that title. It may have been removed, or the link is wrong.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
