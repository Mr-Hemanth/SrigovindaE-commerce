import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminSubscribers from '@/components/admin/AdminSubscribers';

export const metadata = { title: 'Admin · Subscribers' };

export default function AdminSubscribersPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <AdminSubscribers />
        </main>
      </div>
    </AdminGuard>
  );
}
