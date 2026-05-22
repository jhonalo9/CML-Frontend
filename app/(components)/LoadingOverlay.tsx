// components/LoadingOverlay.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  show?: boolean;
  delay?: number; // Milisegundos antes de mostrar
  message?: string;
}

export default function LoadingOverlay({ 
  show = true, 
  delay = 300,
  message = 'Procesando...' 
}: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (show) {
      // Solo mostrar después de un delay (evita parpadeos rápidos)
      timer = setTimeout(() => {
        setVisible(true);
      }, delay);
    } else {
      setVisible(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, delay]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-8 max-w-sm mx-4 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full blur-lg opacity-50"></div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-800">{message}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Por favor, espera un momento
            </p>
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}