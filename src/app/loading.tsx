export default function Loading() {
  return (
    <div className="container-x py-8">
      <div className="skeleton h-8 w-64 rounded-lg" />
      <div className="mt-2 skeleton h-4 w-40 rounded" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden"><div className="skeleton h-36" /><div className="p-4 space-y-2"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-4 w-1/2 rounded" /><div className="skeleton h-4 w-1/3 rounded" /></div></div>
        ))}
      </div>
    </div>
  );
}
