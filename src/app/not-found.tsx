import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center min-h-screen">
      <h1 className="text-6xl font-bold">404</h1>

      <p className="text-muted-foreground">Oeps! Deze pagina bestaat niet.</p>

      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Terug naar home
      </Link>
    </main>
  );
}
