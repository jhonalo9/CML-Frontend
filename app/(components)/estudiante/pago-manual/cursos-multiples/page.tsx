// app/estudiante/pago-manual/cursos-multiples/page.tsx

'use client';
import { Suspense } from 'react';
import PagoManualMultiplePage from './PagoManualMultipleContent';
import { Card, CardContent } from '@/components/ui/card';

function LoadingFallback() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PagoManualMultiplePage />
    </Suspense>
  );
}
