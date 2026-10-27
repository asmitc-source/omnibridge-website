import { BRAND } from "@/config/site";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="text-xl font-medium">{BRAND.name} — waitlist coming soon</h1>
    </main>
  );
}
