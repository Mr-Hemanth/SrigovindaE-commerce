import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';
import AdminReviews from '@/components/admin/AdminReviews';

export const metadata = { title: 'Admin · Reviews' };

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-8">
          <AdminReviews />
        </main>
      </div>
    </AdminGuard>
  );
}
