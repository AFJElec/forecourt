export default function Loading() {
  return (
    <div className="container-page grid gap-5 py-10 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-mist-200">
          <div className="aspect-[4/3] bg-mist-200" />
          <div className="space-y-3 p-5"><div className="h-4 w-2/3 rounded bg-mist-200" /><div className="h-6 w-1/3 rounded bg-mist-200" /><div className="h-3 w-full rounded bg-mist-100" /></div>
        </div>
      ))}
    </div>
  );
}
