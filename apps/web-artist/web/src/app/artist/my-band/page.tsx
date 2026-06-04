'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BandMember {
  id: string;
  artistId: string;
  role: string | null;
  inviteMessage: string | null;
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
  myRole?: string;
  myStatus?: string;
  isMyBandAdmin?: boolean;
}

interface Invitation {
  id: string;
  role: string | null;
  inviteMessage: string | null;
  joinedAt: string;
  band: { id: string; name: string; slug: string; avatar: string | null; city: string; country: string };
}

interface ArtistSearchResult {
  id: string;
  nombre?: string;
  artistName?: string;
  name?: string;
  city?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function AvatarCircle({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-xl' };
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── Members Section ───────────────────────────────────────────────────────────

function MembersSection({ band, isAdmin, currentUserId, onRefresh }: {
  band: Band;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/artists?q=${encodeURIComponent(searchQuery)}&limit=5`, { credentials: 'include' });
      const data = await res.json();
      const list: ArtistSearchResult[] = (data.artists ?? data.data ?? []).map((a: ArtistSearchResult) => ({
        id: a.id,
        nombre: a.nombre ?? a.artistName ?? a.name ?? 'Artista',
        city: a.city,
      }));
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedArtist) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/bands/${band.id}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          artistId: selectedArtist.id,
          role: inviteRole.trim() || undefined,
          inviteMessage: inviteMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al invitar');
      } else {
        toast.success('Invitación enviada');
        setSelectedArtist(null);
        setSearchQuery('');
        setSearchResults([]);
        setInviteRole('');
        setInviteMessage('');
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
            {active.map((m) => {
              const isLead = m.artistId === band.leadArtistId;
              const isMe = m.artistId === currentUserId;
              return (
                <li key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isMe ? 'Yo' : `···${m.artistId.slice(-8)}`}
                      {m.isAdmin && <span className="ml-2 text-xs bg-orange-100 text-orange-700 rounded px-1.5 py-0.5">Admin</span>}
                      {isLead && <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">Fundador</span>}
                    </p>
                    {m.role && <p className="text-xs text-gray-500">{m.role}</p>}
                  </div>
                  {isAdmin && !isLead && !isMe && (
                    <button
                      onClick={() => handleRemove(m.artistId)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Invitaciones pendientes ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li key={m.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">···{m.artistId.slice(-8)}</p>
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

          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {isSearching ? '...' : 'Buscar'}
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <ul className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {searchResults.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => { setSelectedArtist(a); setSearchResults([]); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors text-sm"
                  >
                    <span className="font-medium text-gray-900">{a.nombre}</span>
                    {a.city && <span className="ml-2 text-gray-400">{a.city}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Selected artist */}
          {selectedArtist && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
              <span className="text-green-700 font-medium flex-1">{selectedArtist.nombre}</span>
              <button onClick={() => setSelectedArtist(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
          )}

          {selectedArtist && (
            <>
              <input
                type="text"
                placeholder="Rol (ej. Baterista, opcional)"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <textarea
                placeholder="Mensaje de invitación (opcional)"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </>
          )}

          <button
            onClick={handleInvite}
            disabled={!selectedArtist || inviting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            {inviting ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Openings Section ──────────────────────────────────────────────────────────

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
        setNewRole(''); setNewDesc(''); setNewSlots(1);
        onRefresh();
      }
    } finally { setCreating(false); }
  };

  const handleClose = async (oid: string) => {
    const res = await fetch(`/api/bands/${band.id}/openings/${oid}/close`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (res.ok) { toast.success('Posición cerrada'); onRefresh(); }
  };

  const loadApplications = async (oid: string) => {
    setSelectedOpening(oid);
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/bands/${band.id}/openings/${oid}/applications`, { credentials: 'include' });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } finally { setLoadingApps(false); }
  };

  const handleRespond = async (aid: string, accept: boolean) => {
    const res = await fetch(`/api/bands/applications/${aid}/respond`, {
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

  const openings = band.openings.filter((o) => o.isOpen);

  return (
    <div className="space-y-6">
      {openings.length === 0 ? (
        <p className="text-sm text-gray-400">No hay posiciones abiertas.</p>
      ) : (
        <ul className="space-y-3">
          {openings.map((o) => (
            <li key={o.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{o.role}</p>
                  {o.description && <p className="text-sm text-gray-500 mt-0.5">{o.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {o._count?.applications ?? 0} postulaciones · {o.slots} cupo(s)
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
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
                  </div>
                )}
              </div>

              {selectedOpening === o.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {loadingApps ? (
                    <p className="text-sm text-gray-400">Cargando...</p>
                  ) : applications.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin postulaciones aún.</p>
                  ) : (
                    <ul className="space-y-3">
                      {applications.map((app) => (
                        <li key={app.id} className="bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">···{app.artistId.slice(-8)}</p>
                              {app.message && <p className="text-xs text-gray-500 mt-0.5">"{app.message}"</p>}
                            </div>
                            {app.status === 'PENDING' && isAdmin && (
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleRespond(app.id, true)}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium rounded px-2 py-1"
                                >
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleRespond(app.id, false)}
                                  className="text-xs border border-gray-300 hover:bg-gray-100 text-gray-600 rounded px-2 py-1"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {app.status !== 'PENDING' && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {app.status === 'ACCEPTED' ? 'Aceptado' : 'Rechazado'}
                              </span>
                            )}
                          </div>
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

      {isAdmin && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Abrir nueva posición</h3>
          <input
            type="text"
            placeholder="Rol * (ej. Baterista, Guitarrista)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Cupos:</span>
            <button onClick={() => setNewSlots((s) => Math.max(1, s - 1))} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">−</button>
            <span className="text-sm font-semibold w-4 text-center">{newSlots}</span>
            <button onClick={() => setNewSlots((s) => Math.min(10, s + 1))} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
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

// ── Edit Band Section ─────────────────────────────────────────────────────────

function EditBandSection({ band, isLead, onRefresh, onDeleted }: {
  band: Band;
  isLead: boolean;
  onRefresh: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(band.name);
  const [bio, setBio] = useState(band.bio ?? '');
  const [city, setCity] = useState(band.city);
  const [country, setCountry] = useState(band.country);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/bands/${band.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() || undefined, city: city.trim(), country: country.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al guardar');
      } else {
        toast.success('Banda actualizada');
        onRefresh();
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la banda "${band.name}"? Esta acción es permanente.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bands/${band.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok || res.status === 204) {
        toast.success('Banda eliminada');
        onDeleted();
      } else {
        const d = await res.json();
        toast.error(d.error || 'No se pudo eliminar');
      }
    } finally { setDeleting(false); }
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Cuéntanos sobre la banda..."
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Slug:</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{band.slug}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {isLead && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
          >
            {deleting ? 'Eliminando...' : 'Eliminar banda'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Pending Invitations ───────────────────────────────────────────────────────

function PendingInvitationsSection({ onAccepted }: { onAccepted: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bands/invitations/my', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setInvitations(Array.isArray(d) ? d : []))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (bandId: string, accept: boolean) => {
    setResponding(bandId);
    try {
      const res = await fetch(`/api/bands/${bandId}/members/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accept }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al responder');
      } else {
        toast.success(accept ? 'Te uniste a la banda' : 'Invitación rechazada');
        setInvitations((prev) => prev.filter((i) => i.band.id !== bandId));
        if (accept) onAccepted();
      }
    } finally { setResponding(null); }
  };

  if (loading || invitations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">Invitaciones pendientes</h2>
      <ul className="space-y-3">
        {invitations.map((inv) => (
          <li key={inv.id} className="bg-white border border-orange-200 rounded-2xl p-4 flex items-start gap-4">
            <AvatarCircle name={inv.band.name} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{inv.band.name}</p>
              <p className="text-xs text-gray-500">
                {inv.band.city}, {inv.band.country}{inv.role ? ` · ${inv.role}` : ''}
              </p>
              {inv.inviteMessage && (
                <p className="text-xs text-gray-400 mt-1 italic">"{inv.inviteMessage}"</p>
              )}
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

// ── Create Band Modal ─────────────────────────────────────────────────────────

function CreateBandModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Guatemala');
  const [bio, setBio] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (name.trim().length < 2 || !city.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), city: city.trim(), country: country.trim(), bio: bio.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al crear banda');
      } else {
        toast.success('Banda creada');
        onCreated();
      }
    } finally { setCreating(false); }
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Crear banda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la banda" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio (opcional)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Cuéntanos sobre la banda..." className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg py-2 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={name.trim().length < 2 || !city.trim() || creating}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            {creating ? 'Creando...' : 'Crear banda'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Band List View ────────────────────────────────────────────────────────────

function BandListView({ bands, filterQuery, onFilterChange, onSelect, onCreateClick }: {
  bands: Band[];
  filterQuery: string;
  onFilterChange: (q: string) => void;
  onSelect: (band: Band) => void;
  onCreateClick: () => void;
}) {
  const filtered = filterQuery
    ? bands.filter((b) => b.name.toLowerCase().includes(filterQuery.toLowerCase()) || b.city.toLowerCase().includes(filterQuery.toLowerCase()))
    : bands;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={filterQuery}
          onChange={(e) => onFilterChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span> Nueva
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No se encontraron bandas.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((band) => {
            const activeCount = band.members?.filter((m) => m.status === 'ACTIVE').length ?? 0;
            return (
              <li key={band.id}>
                <button
                  onClick={() => onSelect(band)}
                  className="w-full text-left bg-white border border-gray-100 hover:border-orange-200 hover:shadow-sm rounded-2xl p-4 flex items-center gap-4 transition-all"
                >
                  <AvatarCircle name={band.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{band.name}</p>
                    <p className="text-xs text-gray-500">{band.city}, {band.country}</p>
                    <p className="text-xs text-orange-500 mt-0.5">{activeCount} miembro{activeCount !== 1 ? 's' : ''}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'members' | 'openings' | 'edit';

export default function MyBandPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [filterQuery, setFilterQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchBands = useCallback(async () => {
    try {
      const res = await fetch('/api/bands/my/all', { credentials: 'include' });
      if (res.status === 401) { router.push('/login?redirect=/artist/my-band'); return; }
      if (!res.ok) { setBands([]); return; }
      const data = await res.json();
      const list: Band[] = data.bands ?? data.data ?? (data.id ? [data] : []);
      setBands(list);
      if (selectedBand) {
        const updated = list.find((b) => b.id === selectedBand.id);
        setSelectedBand(updated ?? null);
      }
    } catch {
      setBands([]);
    } finally {
      setLoading(false);
    }
  }, [router, selectedBand]);

  useEffect(() => { void fetchBands(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBandCreated = async () => {
    setShowCreateModal(false);
    setLoading(true);
    await fetchBands();
  };

  const handleBandDeleted = async () => {
    setSelectedBand(null);
    setLoading(true);
    await fetchBands();
  };

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

  if (user?.category && user.category !== 'MUSICO') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sección exclusiva para músicos</h2>
            <p className="text-sm text-gray-500">La gestión de bandas está disponible únicamente para artistas de la categoría Música.</p>
          </div>
        </main>
      </div>
    );
  }

  // ── No bands yet ──
  if (bands.length === 0 && !selectedBand) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-2xl mx-auto w-full">
          <PendingInvitationsSection onAccepted={() => { setLoading(true); fetchBands(); }} />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes una banda en Piums</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-sm">Crea el perfil de tu banda para gestionarla, invitar músicos y publicar posiciones abiertas.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl px-8 py-3 transition-colors"
            >
              Crear banda
            </button>
          </div>
          {showCreateModal && <CreateBandModal onCreated={handleBandCreated} onClose={() => setShowCreateModal(false)} />}
        </main>
      </div>
    );
  }

  // ── Band list (no selected) ──
  if (!selectedBand) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis bandas</h1>
          </div>
          <PendingInvitationsSection onAccepted={() => { setLoading(true); fetchBands(); }} />
          <BandListView
            bands={bands}
            filterQuery={filterQuery}
            onFilterChange={setFilterQuery}
            onSelect={(b) => { setSelectedBand(b); setActiveTab('members'); }}
            onCreateClick={() => setShowCreateModal(true)}
          />
          {showCreateModal && <CreateBandModal onCreated={handleBandCreated} onClose={() => setShowCreateModal(false)} />}
        </main>
      </div>
    );
  }

  // ── Band detail ──
  const band = selectedBand;
  const myId = user?.id ?? '';
  const isLead = band.leadArtistId === myId;
  const isAdmin = isLead || band.members?.some((m) => m.artistId === myId && m.isAdmin && m.status === 'ACTIVE');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'members', label: `Integrantes (${(band.members ?? []).filter((m) => m.status !== 'INACTIVE').length})` },
    { id: 'openings', label: `Posiciones (${(band.openings ?? []).filter((o) => o.isOpen).length})` },
    { id: 'edit', label: 'Editar' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 px-4 lg:px-8 pt-20 lg:pt-8 pb-8 max-w-3xl mx-auto w-full">
        {/* Back + header */}
        <div className="flex items-center gap-4 mb-8">
          {bands.length > 1 && (
            <button
              onClick={() => setSelectedBand(null)}
              className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
            >
              ← Mis bandas
            </button>
          )}
          <div className="flex items-center gap-4 flex-1">
            <AvatarCircle name={band.name} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{band.name}</h1>
              <p className="text-sm text-gray-500">{band.city}, {band.country}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'members' && (
            <MembersSection band={band} isAdmin={!!isAdmin} currentUserId={myId} onRefresh={() => { setLoading(true); fetchBands(); }} />
          )}
          {activeTab === 'openings' && (
            <OpeningsSection band={band} isAdmin={!!isAdmin} onRefresh={() => { setLoading(true); fetchBands(); }} />
          )}
          {activeTab === 'edit' && isAdmin ? (
            <EditBandSection band={band} isLead={isLead} onRefresh={() => { setLoading(true); fetchBands(); }} onDeleted={handleBandDeleted} />
          ) : activeTab === 'edit' ? (
            <p className="text-sm text-gray-500">Solo los administradores pueden editar la banda.</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
