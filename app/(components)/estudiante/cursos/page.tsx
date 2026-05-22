// app/estudiante/cursos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  ShoppingCart,
  Tag,
  CheckCircle
} from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';

interface Curso {
  id: number;
  nombre: string;
  codigoCurso: string;
  precio: number;
  descripcion?: string;
  totalUnidades?: number;
  profesores?: any[];
  _count?: {
    unidades: number;
    evaluaciones: number;
    inscripciones: number;
  };
}

export default function CursosPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursos, setSelectedCursos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [descuentoInfo, setDescuentoInfo] = useState<{
    tieneDescuento: boolean;
    porcentaje: number;
    montoDescuento: number;
    totalConDescuento: number;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    calcularDescuento();
  }, [selectedCursos]);

  const cargarCursos = async () => {
    try {
      const response = await apiClient.get('/inscripciones/disponibles');
      if (response.data.success) {
        setCursos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setError('Error al cargar los cursos disponibles');
    } finally {
      setLoadingCursos(false);
    }
  };

  const calcularDescuento = async () => {
    if (selectedCursos.length === 0) {
      setDescuentoInfo(null);
      return;
    }

    try {
      const response = await apiClient.post('/inscripciones/calcular-descuento', {
        cursoIds: selectedCursos
      });

      if (response.data.success) {
        setDescuentoInfo({
          tieneDescuento: response.data.data.porcentajeDescuento > 0,
          porcentaje: response.data.data.porcentajeDescuento,
          montoDescuento: response.data.data.descuento,
          totalConDescuento: response.data.data.total
        });
      }
    } catch (error) {
      console.error('Error calculando descuento:', error);
      // Si falla, calcular básico
      const total = selectedCursos.reduce((sum, cursoId) => {
        const curso = cursos.find(c => c.id === cursoId);
        return sum + (curso?.precio || 0);
      }, 0);

      let descuento = 0;
      let porcentaje = 0;
      
      if (selectedCursos.length >= 12) {
        porcentaje = 10;
        descuento = total * 0.10;
      } else if (selectedCursos.length === 6) {
        porcentaje = 5;
        descuento = total * 0.05;
      }

      setDescuentoInfo({
        tieneDescuento: porcentaje > 0,
        porcentaje,
        montoDescuento: descuento,
        totalConDescuento: total - descuento
      });
    }
  };

  const handleInscribirMultiples = async () => {
    if (selectedCursos.length === 0) {
      alert('Selecciona al menos un curso');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Usar el nuevo endpoint de inscripción múltiple
      const response = await apiClient.post('/inscripciones/inscribir-multiples', {
        cursoIds: selectedCursos
      });

      if (response.data.success) {
        // Obtener los IDs de las inscripciones creadas
        const inscripcionIds = response.data.data.inscripciones.map((insc: any) => insc.id);
        
        // Redirigir a resumen con los IDs de las inscripciones
        router.push(`/estudiante/resumen-pagos?inscripciones=${inscripcionIds.join(',')}`);
      }
    } catch (error: any) {
      console.error('Error inscribiendo a cursos múltiples:', error);
      setError(error.response?.data?.message || 'Error al inscribirse a los cursos');
      alert(error.response?.data?.message || 'Error al inscribirse a los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCurso = (cursoId: number) => {
    setSelectedCursos(prev => {
      if (prev.includes(cursoId)) {
        return prev.filter(id => id !== cursoId);
      } else {
        // Validar límite máximo (opcional)
        const MAX_SELECCION = 12;
        if (prev.length >= MAX_SELECCION) {
          alert(`Solo puedes seleccionar máximo ${MAX_SELECCION} cursos a la vez`);
          return prev;
        }
        return [...prev, cursoId];
      }
    });
  };

  const subtotal = selectedCursos.reduce((sum, cursoId) => {
    const curso = cursos.find(c => c.id === cursoId);
    return sum + (curso?.precio || 0);
  }, 0);

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Selección de Cursos
          </CardTitle>
          <CardDescription>
            Elige los cursos en los que deseas inscribirte. Puedes seleccionar múltiples cursos y obtener descuentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Banner promocional */}
          {selectedCursos.length === 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-800">¡Descuentos por inscripción múltiple!</h4>
                  <ul className="mt-2 text-sm text-purple-700 space-y-1">
                    <li>• <strong>2 cursos:</strong> 5% de descuento</li>
                    <li>• <strong>3 o más cursos:</strong> 10% de descuento</li>
                    <li>• Un solo pago para todos los cursos seleccionados</li>
                    <li>• Acceso inmediato después del pago confirmado</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loadingCursos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando cursos disponibles...</p>
            </div>
          ) : cursos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay cursos disponibles para inscripción.</p>
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="mt-4"
                variant="outline"
              >
                Volver al Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contador de selección */}
              {selectedCursos.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">
                      {selectedCursos.length} curso(s) seleccionado(s)
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {selectedCursos.length >= 3 
                      ? '10% de descuento aplicado' 
                      : selectedCursos.length === 2 
                        ? '5% de descuento aplicado'
                        : 'Sin descuento'}
                  </Badge>
                </div>
              )}

              {/* Lista de cursos */}
              <div className="grid gap-4">
                {cursos.map((curso) => (
                  <div 
                    key={curso.id} 
                    className={`flex items-start space-x-4 p-4 border rounded-lg transition-all hover:shadow-md ${
                      selectedCursos.includes(curso.id) 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={`curso-${curso.id}`}
                      checked={selectedCursos.includes(curso.id)}
                      onCheckedChange={() => handleToggleCurso(curso.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <Label 
                            htmlFor={`curso-${curso.id}`} 
                            className="font-medium text-lg cursor-pointer"
                          >
                            {curso.nombre}
                          </Label>
                          <p className="text-sm text-gray-600">{curso.codigoCurso}</p>
                          {curso.descripcion && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {curso.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {curso._count && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {curso._count.unidades || curso.totalUnidades || 4} unidades
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {curso._count.evaluaciones || 4} evaluaciones
                                </Badge>
                                {curso._count.inscripciones && (
                                  <Badge variant="outline" className="text-xs">
                                    {curso._count.inscripciones} estudiantes
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-700">
                            ${Number(curso.precio).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">por curso</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de compra */}
              {selectedCursos.length > 0 && (
                <>
                  <Separator />
                  
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">Resumen del Pedido</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal ({selectedCursos.length} cursos):</span>
                        <span className="font-medium">${Number(subtotal).toFixed(2)}</span>
                      </div>
                      
                      {descuentoInfo?.tieneDescuento && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento ({descuentoInfo.porcentaje}%):</span>
                          <span className="font-medium">-${Number(descuentoInfo.montoDescuento).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total a pagar:</span>
                        <span className="text-green-600">
                          ${Number(descuentoInfo?.totalConDescuento || subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Ventajas de inscripción múltiple:</strong>
                      </p>
                      <ul className="mt-2 text-sm text-blue-600 space-y-1">
                        <li>• Un solo pago consolidado</li>
                        <li>• Descuentos progresivos</li>
                        <li>• Acceso simultáneo a todos los cursos</li>
                        <li>• Gestión centralizada de tu progreso</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleInscribirMultiples} 
                      className="w-full"
                      disabled={loading || selectedCursos.length === 0}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando inscripción...
                        </>
                      ) : (
                        `Inscribirse a ${selectedCursos.length} Curso(s) - $${Number(descuentoInfo?.totalConDescuento || subtotal).toFixed(2)}`
                      )}
                    </Button>
                    
                    <p className="text-sm text-gray-500 text-center">
                      * Después de inscribirte, serás redirigido a la página de pagos
                    </p>
                  </div>
                </>
              )}

              {/* Información adicional */}
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Nota:</strong> Puedes seleccionar entre 1 y 6 cursos por inscripción.</p>
                <p>Si ya estás inscrito en un curso, no aparecerá en esta lista.</p>
                <p>Para consultas: admin@ministeriolaico.com</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}