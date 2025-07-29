'use client';

import InfoPage from '@/components/InfoPage';

export default function InfoPageRoute() {
  return <InfoPage onClose={() => window.history.back()} />;
}