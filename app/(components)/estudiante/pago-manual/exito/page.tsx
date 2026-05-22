import { Suspense } from 'react';
import PagoManualExitoContent from './PagoManualExitoContent';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PagoManualExitoContent />
    </Suspense>
  );
}