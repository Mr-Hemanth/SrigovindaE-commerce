import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminOrders from '@/components/admin/AdminOrders';

export const metadata = { title: 'Admin · Orders' };

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminOrders />
        </main>
      </div>
    </AdminGuard>
  );
}
