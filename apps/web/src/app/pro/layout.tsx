import type { Metadata } from 'next';
import { RequireAuth } from '@/components/auth/require-auth';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell variant="pro">{children}</DashboardShell>
    </RequireAuth>
  );
}
