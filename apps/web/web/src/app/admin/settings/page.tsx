'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Platform configuration and settings</p>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Settings size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Coming Soon</h2>
        <p className="text-gray-500">
          Platform configuration options will be available here
        </p>
      </div>
    </div>
  );
}
