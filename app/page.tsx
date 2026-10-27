import { SiteShell } from "@/components/shell/SiteShell";
import { BRAND } from "@/config/site";

export default function Home() {
  return (
    <SiteShell>
      <div className="flex flex-1 items-center justify-center p-8">
        <h1 className="text-xl font-medium">{BRAND.name} — waitlist coming soon</h1>
      </div>
    </SiteShell>
  );
}
