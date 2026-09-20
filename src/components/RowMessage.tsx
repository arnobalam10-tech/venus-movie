export default function RowMessage({ title, message }: { title: string; message: string }) {
  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-6">{title}</h2>
      <p className="px-4 text-sm text-muted sm:px-6">{message}</p>
    </section>
  );
}
