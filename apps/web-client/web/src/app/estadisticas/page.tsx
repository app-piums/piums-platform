'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';

export default function EstadisticasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=stats');
  }, [router]);
  return <Loading fullScreen />;
}
