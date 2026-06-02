import { AppShell } from "@/components/layout/AppShell";
import { LoginPageClient } from "@/features/auth/LoginPageClient";

export default function LoginPage() {
  return (
    <AppShell>
      <LoginPageClient />
    </AppShell>
  );
}
