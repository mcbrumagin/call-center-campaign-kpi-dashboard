import { getApiToken } from '@/lib/session';
import { DashboardStats } from '@/components/admin/DashboardStats';

export default async function AdminDashboard() {
  const token = await getApiToken();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome to the ShyftOff admin dashboard
        </p>
      </div>

      <DashboardStats token={token!} />
    </div>
  );
}
