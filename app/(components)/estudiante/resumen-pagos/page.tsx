import { Suspense } from 'react';
import ResumenPagosContent from './ResumenPagosContent';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResumenPagosContent />
    </Suspense>
  );
}