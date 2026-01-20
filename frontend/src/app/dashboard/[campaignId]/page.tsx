import { CampaignDashboard } from '@/components/dashboard/CampaignDashboard';

interface DashboardPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { campaignId } = await params;
  const id = parseInt(campaignId, 10);

  if (isNaN(id)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Campaign</h1>
          <p className="text-gray-500 mt-2">Please provide a valid campaign ID</p>
        </div>
      </div>
    );
  }

  return <CampaignDashboard campaignId={id} />;
}
