import { RequireAdmin } from '@/components/auth/require-admin';
import { DashboardShell } from '@/components/dashboard/shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <DashboardShell>{children}</DashboardShell>
    </RequireAdmin>
  );
}
