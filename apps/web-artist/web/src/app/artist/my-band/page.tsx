'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BandMember {
  id: string;
  artistId: string;
  role: string | null;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  isAdmin: boolean;
  joinedAt: string;
}

interface BandOpening {
  id: string;
  role: string;
  description: string | null;
  slots: number;
  isOpen: boolean;
  createdAt: string;
  _count?: { applications: number };
}

interface BandApplication {
  id: string;
  artistId: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface Band {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  genre: string[];
  specialties: string[];
  country: string;
  city: string;
  leadArtistId: string;
  isBookable: boolean;
  members: BandMember[];
  openings: BandOpening[];
}

// ── Sections ──────────────────────────────────────────────────────────────────

function MembersSection({ band, isAdmin, onRefresh }: { band: Band; isAdmin: boolean; onRefresh: () => void }) {
  const [inviteId, setInviteId] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/bands/${band.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ artistId: inviteId.trim(), role: inviteRole.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al invitar');
      } else {
        toast.success('Invitación enviada');
        setInviteId('');
        setInviteRole('');
        onRefresh();
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (artistId: string) => {
    if (!confirm('¿Remover este miembro de la banda?')) return;
    const res = await fetch(`/api/bands/${band.id}/members/${artistId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok || res.status === 204) {
      toast.success('Miembro removido');
      onRefresh();
    } else {
      toast.error('No se pudo remover al miembro');
    }
  };

  const active = band.members.filter((m) => m.status === 'ACTIVE');
  const pending = band.members.filter((m) => m.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Active members */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Integrantes activos ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400">Sin integrantes activos aún.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((m) => (
              <li key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {m.artistId.slice(0, 8)}...
                    {m.isAdmin && <span className="ml-2 text-xs bg-orange-100 text-orange-700 rounded px-1.5 py-0.5">Admin</span>}
                  </p>
                  {m.role && <p className="text-xs text-gray-500">{m.role}</p>}
                </div>
                {isAdmin && !m.isAdmin && (
                  <button
                    onClick={() => handleRemove(m.artistId)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Invitaciones pendientes ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li key={m.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.artistId.slice(0, 8)}...</p>
                  {m.role && <p className="text-xs text-gray-500">{m.role}</p>}
                </div>
                <span className="text-xs text-yellow-700 font-medium">Pendiente</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite form */}
      {isAdmin && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Invitar músico</h3>
          <input
            type="text"
            placeholder="ID del artista"
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="text"
            placeholder="Rol (ej. Baterista, opcional)"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleInvite}
            disabled={!inviteId.trim() || inviting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            {inviting ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>
      )}
    </div>
  );
}

function OpeningsSection({ band, isAdmin, onRefresh }: { band: Band; isAdmin: boolean; onRefresh: () => void }) {
  const [newRole, setNewRole] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSlots, setNewSlots] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<string | null>(null);
  const [applications, setApplications] = useState<BandApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const handleCreate = async () => {
    if (!newRole.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/bands/${band.id}/openings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole.trim(), description: newDesc.trim() || undefined, slots: newSlots }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al crear posición');
      } else {
        toast.success('Posición publicada');
        setNewRole('');
        setNewDesc('');
        setNewSlots(1);
        onRefresh();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (oid: string) => {
    const res = await fetch(`/api/bands/${band.id}/openings/${oid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ close: true }),
    });
    if (res.ok) {
      toast.success('Posición cerrada');
      onRefresh();
    }
  };

  const loadApplications = async (oid: string) => {
    setSelectedOpening(oid);
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/bands/${band.id}/openings/${oid}/applications`, { credentials: 'include' });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleRespond = async (aid: string, accept: boolean) => {
    const res = await fetch(`/api/bands/applications/${aid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accept }),
    });
    if (res.ok) {
      toast.success(accept ? 'Postulación aceptada' : 'Postulación rechazada');
      if (selectedOpening) loadApplications(selectedOpening);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing openings */}
      {band.openings.length === 0 ? (
        <p className="text-sm text-gray-400">No hay posiciones abiertas.</p>
      ) : (
        <ul className="space-y-3">
          {band.openings.map((o) => (
            <li key={o.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{o.role}</p>
                  {o.description && <p className="text-sm text-gray-500 mt-0.5">{o.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {o._count?.applications ?? 0} postulaciones · {o.slots} cupo(s)
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => loadApplications(o.id)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Ver postulantes
                      </button>
                      <button
                        onClick={() => handleClose(o.id)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Cerrar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Applications drawer */}
              {selectedOpening === o.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {loadingApps ? (
                    <p className="text-sm text-gray-400">Cargando...</p>
                  ) : applications.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin postulaciones aún.</p>
                  ) : (
                    <ul className="space-y-2">
                      {applications.map((a) => (
                        <li key={a.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{a.artistId.slice(0, 8)}...</p>
                            {a.message && <p className="text-xs text-gray-500 mt-0.5 italic">"{a.message}"</p>}
                            <span className={`text-xs font-medium mt-1 inline-block ${
                              a.status === 'ACCEPTED' ? 'text-green-600' :
                              a.status === 'REJECTED' ? 'text-red-500' : 'text-yellow-600'
                            }`}>
                              {a.status === 'ACCEPTED' ? 'Aceptada' : a.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                            </span>
                          </div>
                          {a.status === 'PENDING' && isAdmin && (
                            <div className="flex gap-2 ml-3">
                              <button
                                onClick={() => handleRespond(a.id, true)}
                                className="text-xs bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleRespond(a.id, false)}
                                className="text-xs bg-red-400 hover:bg-red-500 text-white rounded px-2 py-1"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Create new opening */}
      {isAdmin && (
        <div className="border border-dashed border-orange-300 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Publicar nueva posición</h3>
          <input
            type="text"
            placeholder="Rol buscado (ej. Baterista)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Cupos:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={newSlots}
              onChange={(e) => setNewSlots(Math.max(1, Number(e.target.value)))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newRole.trim() || creating}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            {creating ? 'Publicando...' : 'Publicar posición'}
          </button>
        </div>
      )}
    </div>
  );
}

function EditBandSection({ band, onRefresh }: { band: Band; onRefresh: () => void }) {
  const [name, setName] = useState(band.name);
  const [bio, setBio] = useState(band.bio ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/bands/${band.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al guardar');
      } else {
        toast.success('Banda actualizada');
        onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la banda</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Cuéntanos sobre la banda..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Slug:</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{band.slug}</span>
      </div>
      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBandState({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (name.trim().length < 2) return;
    setCreating(true);
    try {
      const res = await fetch('/api/bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), country: 'GT', city: 'Guatemala' }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al crear banda');
      } else {
        const band = await res.json();
        toast.success('Banda creada');
        onCreate(band.name);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes una banda en Piums</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        Crea el perfil de tu banda para gestionarla, invitar músicos y publicar posiciones abiertas.
      </p>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="text"
          placeholder="Nombre de tu banda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={handleCreate}
          disabled={name.trim().length < 2 || creating}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
        >
          {creating ? 'Creando...' : 'Crear banda'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'members' | 'openings' | 'edit';

interface Invitation {
  id: string;
  role: string | null;
  joinedAt: string;
  band: { id: string; name: string; slug: string; avatar: string | null; city: string; country: string };
}

function PendingInvitationsSection({ onAccepted }: { onAccepted: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bands/invitations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setInvitations(Array.isArray(d) ? d : []))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (bandId: string, accept: boolean) => {
    setResponding(bandId);
    try {
      const res = await fetch(`/api/bands/${bandId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ respond: true, accept }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al responder');
      } else {
        toast.success(accept ? 'Te uniste a la banda' : 'Invitación rechazada');
        setInvitations((prev) => prev.filter((i) => i.band.id !== bandId));
        if (accept) onAccepted();
      }
    } finally {
      setResponding(null);
    }
  };

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">Invitaciones pendientes</h2>
      <ul className="space-y-3">
        {invitations.map((inv) => (
          <li key={inv.id} className="bg-white border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {inv.band.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{inv.band.name}</p>
              <p className="text-xs text-gray-500">{inv.band.city}, {inv.band.country}{inv.role ? ` · ${inv.role}` : ''}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleRespond(inv.band.id, true)}
                disabled={responding === inv.band.id}
                className="text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg px-3 py-1.5 transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => handleRespond(inv.band.id, false)}
                disabled={responding === inv.band.id}
                className="text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-600 font-medium rounded-lg px-3 py-1.5 transition-colors"
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MyBandPage() {
  const router = useRouter();
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('members');

  const fetchBand = useCallback(async () => {
    try {
      const res = await fetch('/api/bands/my', { credentials: 'include' });
      if (res.status === 401) { router.push('/login?redirect=/artist/my-band'); return; }
      const data = await res.json();
      setBand(data ?? null);
    } catch {
      setBand(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void fetchBand(); }, [fetchBand]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!band) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-2xl mx-auto w-full">
          <PendingInvitationsSection onAccepted={fetchBand} />
          <EmptyBandState onCreate={() => fetchBand()} />
        </main>
      </div>
    );
  }

  const isAdmin = band.members.some((m) => m.status === 'ACTIVE' && m.isAdmin);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'members', label: `Integrantes (${band.members.filter((m) => m.status !== 'INACTIVE').length})` },
    { id: 'openings', label: `Postulaciones (${band.openings.length})` },
    { id: 'edit', label: 'Editar banda' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {band.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{band.name}</h1>
            <p className="text-sm text-gray-500">{band.city}, {band.country}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'members' && (
            <MembersSection band={band} isAdmin={isAdmin} onRefresh={fetchBand} />
          )}
          {activeTab === 'openings' && (
            <OpeningsSection band={band} isAdmin={isAdmin} onRefresh={fetchBand} />
          )}
          {activeTab === 'edit' && isAdmin && (
            <EditBandSection band={band} onRefresh={fetchBand} />
          )}
          {activeTab === 'edit' && !isAdmin && (
            <p className="text-sm text-gray-500">Solo los administradores pueden editar la banda.</p>
          )}
        </div>
      </main>
    </div>
  );
}
