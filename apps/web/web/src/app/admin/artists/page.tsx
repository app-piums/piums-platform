'use client';

import React, { useEffect, useState } from 'react';
import { sdk } from '@piums/sdk';
import { Search, CheckCircle, XCircle } from 'lucide-react';

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadArtists();
  }, [page, verified]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const data = await sdk.getAdminArtists({ page, limit: 20, search, verified });
      setArtists(data.artists);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadArtists();
  };

  const handleVerify = async (artistId: string, isVerified: boolean) => {
    try {
      await sdk.verifyArtist(artistId, !isVerified);
      loadArtists();
    } catch (error) {
      console.error('Error verifying artist:', error);
      alert('Error updating artist verification');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Artists Management</h1>
        <p className="text-gray-600 mt-2">Manage and verify artists</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={verified}
            onChange={(e) => { setVerified(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Artists</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Artists Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : artists.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No artists found
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {artists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{artist.email}</div>
                        {artist.name && <div className="text-sm text-gray-500">{artist.name}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {artist.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircle size={12} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>Bookings: {artist.bookingsCount || 0}</div>
                        <div>Reviews: {artist.reviewsCount || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(artist.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleVerify(artist.id, artist.isVerified)}
                        className={`
                          px-3 py-1 rounded-lg transition-colors
                          ${artist.isVerified
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }
                        `}
                      >
                        {artist.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} artists
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
