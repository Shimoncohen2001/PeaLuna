import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/auth/require-admin';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <DashboardShell>{children}</DashboardShell>
    </RequireAdmin>
  );
}
