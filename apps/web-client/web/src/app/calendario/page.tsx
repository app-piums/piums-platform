'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';

export default function CalendarioPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard?tab=calendar');
  }, [router]);
  return <Loading fullScreen />;
}
