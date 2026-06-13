'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJoinGroup } from '@/hooks/useGroups';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Props {
  params: Promise<{ code: string }>;
}

export default function JoinPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const joinGroup = useJoinGroup();

  useEffect(() => {
    if (code) {
      joinGroup.mutateAsync(code.toUpperCase()).then((res) => {
        router.push(`/groups/${res.data.data.id}`);
      }).catch(() => {
        router.push('/groups');
      });
    }
  }, [code]);

  return <LoadingSpinner />;
}
