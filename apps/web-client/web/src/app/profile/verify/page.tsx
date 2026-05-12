'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

const MAX_BIRTH_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
})();

type DocumentType = 'DPI' | 'PASSPORT' | 'RESIDENCE_CARD';

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  DPI: 'DPI (Documento Personal de Identificación)',
  PASSPORT: 'Pasaporte',
  RESIDENCE_CARD: 'Tarjeta de Residencia',
};

interface UploadBoxProps {
  label: string;
  hint: string;
  uploading: boolean;
  preview: string;
  onFile: (file: File) => void;
  optional?: boolean;
}

function UploadBox({ label, hint, uploading, preview, onFile, optional }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FF6B35]/50 hover:bg-orange-50/40 transition-colors min-h-[120px]"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <div className="h-6 w-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      ) : preview ? (
        <div className="relative w-full h-24">
          <Image src={preview} alt={label} fill className="object-contain rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
            <span className="text-white text-xs font-medium">Cambiar</span>
          </div>
        </div>
      ) : (
        <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      <div className="text-center">
        <p className="text-xs font-medium text-gray-700">
          {label} {optional && <span className="text-gray-400">(opcional)</span>}
        </p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
    </div>
  );
}

export default function VerifyClientTab() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  // Basic info
  const [ciudad, setCiudad] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Document info
  const [documentType, setDocumentType] = useState<DocumentType>('DPI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFrontUrl, setDocumentFrontUrl] = useState('');
  const [documentBackUrl, setDocumentBackUrl] = useState('');
  const [documentSelfieUrl, setDocumentSelfieUrl] = useState('');
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  useEffect(() => {
    if (user) {
      setCiudad(user.ciudad || '');
      setBirthDate(
        user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      );
      if ((user as any).documentType) setDocumentType((user as any).documentType);
      if ((user as any).documentNumber) setDocumentNumber((user as any).documentNumber);
      if ((user as any).documentFrontUrl) {
        setDocumentFrontUrl((user as any).documentFrontUrl);
        setFrontPreview((user as any).documentFrontUrl);
      }
      if ((user as any).documentBackUrl) {
        setDocumentBackUrl((user as any).documentBackUrl);
        setBackPreview((user as any).documentBackUrl);
      }
      if ((user as any).documentSelfieUrl) {
        setDocumentSelfieUrl((user as any).documentSelfieUrl);
        setSelfiePreview((user as any).documentSelfieUrl);
      }
    }
  }, [user]);

  const hasBasicInfo = !!(user?.ciudad && user?.birthDate);
  const hasDocuments = !!(
    (user as any)?.documentType &&
    (user as any)?.documentFrontUrl &&
    (user as any)?.documentSelfieUrl
  );
  const isFullyVerified = hasBasicInfo && hasDocuments;

  const uploadFile = async (
    file: File,
    folder: 'front' | 'back' | 'selfie',
    setUploading: (v: boolean) => void,
    setUrl: (u: string) => void,
    setPreview: (p: string) => void
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/users/documents/upload?folder=${folder}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al subir imagen');
      }
      const data = await res.json();
      setUrl(data.url);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciudad.trim()) { toast.error('Ingresa tu ciudad'); return; }
    if (!birthDate) { toast.error('Ingresa tu fecha de nacimiento'); return; }
    if (documentNumber && (!documentFrontUrl || !documentSelfieUrl)) {
      toast.error('Sube la foto frontal y la selfie de tu documento');
      return;
    }

    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const body: Record<string, unknown> = { ciudad: ciudad.trim(), birthDate };
      if (documentType) body.documentType = documentType;
      if (documentNumber.trim()) body.documentNumber = documentNumber.trim();
      if (documentFrontUrl) body.documentFrontUrl = documentFrontUrl;
      if (documentBackUrl) body.documentBackUrl = documentBackUrl;
      if (documentSelfieUrl) body.documentSelfieUrl = documentSelfieUrl;

      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al guardar');
      }

      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        updateUser(meData.user);
      }

      toast.success('Información guardada correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Verificar cuenta</h2>
        <p className="text-sm text-gray-500 mt-1">
          Completa tu información para acceder a todas las funciones de la plataforma.
        </p>
      </div>

      {isFullyVerified ? (
        <div className="flex items-start gap-3 bg-orange-50 border border-[#FF6B35]/30 rounded-xl p-4">
          <svg className="h-5 w-5 text-[#FF6B35] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-[#FF6B35]">Cuenta verificada</p>
            <p className="text-sm text-orange-900 mt-0.5">Tu información está completa. Puedes actualizarla en cualquier momento.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Información pendiente</p>
            <p className="text-sm text-amber-700 mt-0.5">Completa los datos a continuación para activar tu cuenta completamente.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Información básica ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Información básica</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Guatemala, Quetzaltenango..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha de nacimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={MAX_BIRTH_DATE}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Debes ser mayor de 18 años.</p>
          </div>
        </div>

        {/* ── Documento de identidad ── */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Documento de identidad</h3>
            <p className="text-xs text-gray-400 mt-0.5">Requerido para completar reservas y recibir pagos.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] text-sm bg-white"
            >
              {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((k) => (
                <option key={k} value={k}>{DOCUMENT_LABELS[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de documento</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ej. 1234 56789 0101"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UploadBox
              label="Foto frontal"
              hint="Lado con tu foto"
              uploading={uploadingFront}
              preview={frontPreview}
              onFile={(f) => uploadFile(f, 'front', setUploadingFront, setDocumentFrontUrl, setFrontPreview)}
            />
            <UploadBox
              label="Foto trasera"
              hint="Lado con tu código"
              uploading={uploadingBack}
              preview={backPreview}
              onFile={(f) => uploadFile(f, 'back', setUploadingBack, setDocumentBackUrl, setBackPreview)}
              optional
            />
            <UploadBox
              label="Selfie con documento"
              hint="Sosteniendo el documento"
              uploading={uploadingSelfie}
              preview={selfiePreview}
              onFile={(f) => uploadFile(f, 'selfie', setUploadingSelfie, setDocumentSelfieUrl, setSelfiePreview)}
            />
          </div>

          <p className="text-xs text-gray-400">
            Las imágenes deben ser claras y legibles. Formatos aceptados: JPG, PNG, WEBP.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploadingFront || uploadingBack || uploadingSelfie}
            className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold hover:bg-[#e05d00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </form>
    </div>
  );
}
