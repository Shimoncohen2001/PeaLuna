import { RequireAuth } from '@/components/auth/require-auth';
import { DashboardShell } from '@/components/dashboard/shell';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell variant="pro">{children}</DashboardShell>
    </RequireAuth>
  );
}
