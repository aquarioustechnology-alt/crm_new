export default function SectionCard({
  title, description, children,
}: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 space-y-4">
      <header>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </header>
      {children}
    </section>
  );
}
