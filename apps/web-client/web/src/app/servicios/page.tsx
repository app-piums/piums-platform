'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';

export default function ServiciosPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=services');
  }, [router]);
  return <Loading fullScreen />;
}
