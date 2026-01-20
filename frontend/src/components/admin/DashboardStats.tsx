'use client';

import { useQuery } from '@tanstack/react-query';
import { agentsApi, campaignsApi } from '@/lib/api';
import { Users, Megaphone, UserCheck, Activity } from 'lucide-react';
import Link from 'next/link';

interface DashboardStatsProps {
  token: string;
}

export function DashboardStats({ token }: DashboardStatsProps) {
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', 'stats'],
    queryFn: () => agentsApi.list(token, { limit: 1 }),
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', 'stats'],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  });

  const { data: activeAgentsData } = useQuery({
    queryKey: ['agents', 'active'],
    queryFn: () => agentsApi.list(token, { limit: 1, is_active: true }),
  });

  const stats = [
    {
      name: 'Total Agents',
      value: agentsLoading ? '...' : agentsData?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/agents',
    },
    {
      name: 'Active Agents',
      value: agentsLoading ? '...' : activeAgentsData?.total || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      href: '/admin/agents?is_active=true',
    },
    {
      name: 'Total Campaigns',
      value: campaignsLoading ? '...' : campaignsData?.total || 0,
      icon: Megaphone,
      color: 'bg-purple-500',
      href: '/admin/campaigns',
    },
    {
      name: 'Active Campaigns',
      value: campaignsLoading
        ? '...'
        : campaignsData?.data.filter((c) => c.is_active).length || 0,
      icon: Activity,
      color: 'bg-orange-500',
      href: '/admin/campaigns?is_active=true',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
