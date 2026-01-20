import { getApiToken } from '@/lib/session';
import { CampaignsList } from '@/components/admin/CampaignsList';

export default async function CampaignsPage() {
  const token = await getApiToken();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-500 mt-1">
          Manage campaigns and their agent assignments
        </p>
      </div>

      <CampaignsList token={token!} />
    </div>
  );
}
