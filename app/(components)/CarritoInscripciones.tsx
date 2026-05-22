// components/CarritoInscripciones.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CarritoItem {
  id: number;
  nombre: string;
  precio: number;
  codigo: string;
}

interface CarritoInscripcionesProps {
  items: CarritoItem[];
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}

export default function CarritoInscripciones({ 
  items, 
  onRemoveItem, 
  onClearCart 
}: CarritoInscripcionesProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.precio, 0);
  const descuento = items.length >= 3 ? subtotal * 0.10 : items.length === 2 ? subtotal * 0.05 : 0;
  const total = subtotal - descuento;

  const handleIrAPagar = () => {
    const inscripcionIds = items.map(item => item.id);
    router.push(`/estudiante/resumen-pagos?inscripciones=${inscripcionIds.join(',')}`);
  };

  return (
    <div className="relative">
      {/* Botón del carrito */}
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Carrito
        {items.length > 0 && (
          <Badge className="absolute -top-2 -right-2 px-1.5 min-w-[20px]">
            {items.length}
          </Badge>
        )}
      </Button>

      {/* Dropdown del carrito */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Carrito de Inscripciones</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500">{item.codigo}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-semibold">
                          ${item.precio.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Resumen */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({items.length} items):</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento:</span>
                      <span>-${descuento.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={onClearCart}
                    >
                      Vaciar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleIrAPagar}
                    >
                      Pagar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}