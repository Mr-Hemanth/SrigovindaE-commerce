import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminProducts from '@/components/admin/AdminProducts';

export const metadata = { title: 'Admin · Products' };

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminProducts />
        </main>
      </div>
    </AdminGuard>
  );
}
