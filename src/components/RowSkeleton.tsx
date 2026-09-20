export default function RowSkeleton({ title }: { title?: string }) {
  return (
    <section className="py-2">
      {title && (
        <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-6">{title}</h2>
      )}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-2/3 w-[140px] flex-none animate-pulse rounded-lg bg-surface sm:w-[160px]"
          />
        ))}
      </div>
    </section>
  );
}
