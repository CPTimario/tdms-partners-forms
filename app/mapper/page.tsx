import { notFound } from 'next/navigation';

import { MapperPage } from '@/components/mapper/MapperPage';

export default function MapperRoute() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <MapperPage />;
}
