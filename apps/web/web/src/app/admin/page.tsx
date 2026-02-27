'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@piums/sdk';
import StatsCard from '@/components/admin/StatsCard';
import { Users, Palette, Calendar, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await sdk.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error loading stats</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform metrics and activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="Total Artists"
          value={stats.totalArtists}
          icon={<Palette size={24} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<Calendar size={24} className="text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={24} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.bookingsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bookings</span>
              <span className="text-2xl font-bold text-gray-900">{stats.bookingsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue</span>
              <span className="text-2xl font-bold text-gray-900">${stats.revenueThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="text-2xl font-bold text-gray-900">{stats.recentUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Reports</span>
              <span className="text-2xl font-bold text-red-600">{stats.pendingReports}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <p className="text-gray-500 text-sm italic">Recent bookings, new users, and reports will appear here</p>
        </div>
      </div>
    </div>
  );
}
