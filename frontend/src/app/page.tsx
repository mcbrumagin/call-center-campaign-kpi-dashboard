'use client';

import { useQuery } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import Link from 'next/link';
import { Megaphone, Users, ArrowRight, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', 'home'],
    queryFn: () => campaignsApi.list({ limit: 100, is_active: true }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              ShyftOff KPI Dashboard
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Track your call center performance with real-time KPIs, 
              gamified badges, and comprehensive analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Active Campaigns</h2>
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
          >
            Admin Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-2xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : campaigns?.data.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No active campaigns found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns?.data.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/${campaign.id}`}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {campaign.name}
                </h3>
                {campaign.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-blue-300">
                    <Users className="w-4 h-4" />
                    {campaign.agent_count} agents
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Active
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Badge Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Badge System
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Platinum', hours: 240, color: 'from-slate-300 to-slate-400' },
            { name: 'Gold', hours: 180, color: 'from-yellow-400 to-yellow-500' },
            { name: 'Silver', hours: 120, color: 'from-gray-300 to-gray-400' },
            { name: 'Bronze', hours: 60, color: 'from-orange-400 to-orange-500' },
          ].map((badge) => (
            <div
              key={badge.name}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
            >
              <div
                className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${badge.color} mb-3`}
              />
              <h3 className="font-semibold text-white">{badge.name}</h3>
              <p className="text-gray-400 text-sm">{badge.hours}+ hours/day</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2026 ShyftOff. Call Center KPI Dashboard.
          </p>
        </div>
      </footer>
    </div>
  );
}
