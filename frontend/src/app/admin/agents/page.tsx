import { getApiToken } from '@/lib/session';
import { AgentsList } from '@/components/admin/AgentsList';

export default async function AgentsPage() {
  const token = await getApiToken();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-500 mt-1">
          Manage call center agents and their campaign assignments
        </p>
      </div>

      <AgentsList token={token!} />
    </div>
  );
}
