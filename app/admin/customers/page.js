import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminCustomers from '@/components/admin/AdminCustomers';

export const metadata = { title: 'Admin · Customers' };

export default function AdminCustomersPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminCustomers />
        </main>
      </div>
    </AdminGuard>
  );
}
