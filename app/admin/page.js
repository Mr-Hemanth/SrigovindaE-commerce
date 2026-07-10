import AdminGuard from '@/components/AdminGuard';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = { title: 'Admin Dashboard' };

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <div className="flex-1">
          <AdminDashboard />
        </div>
      </div>
    </AdminGuard>
  );
}
