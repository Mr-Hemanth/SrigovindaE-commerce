'use client';

import dynamic from 'next/dynamic';

// next/dynamic's ssr:false option only works inside a Client Component, so this thin wrapper
// exists purely to let the (server) root layout defer EngagementWidgets out of the initial bundle.
const EngagementWidgets = dynamic(() => import('@/components/EngagementWidgets'), { ssr: false });

export default function EngagementWidgetsLoader() {
  return <EngagementWidgets />;
}
