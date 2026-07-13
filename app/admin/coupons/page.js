import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminCoupons from '@/components/admin/AdminCoupons';

export const metadata = { title: 'Admin · Coupons' };

export default function AdminCouponsPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminCoupons />
        </main>
      </div>
    </AdminGuard>
  );
}
