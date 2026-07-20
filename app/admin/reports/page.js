import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminReports from '@/components/admin/AdminReports';

export const metadata = { title: 'Admin · Reports' };

export default function AdminReportsPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminReports />
        </main>
      </div>
    </AdminGuard>
  );
}
