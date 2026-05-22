// app/estudiante/pago-manual/cursos-multiples/PagoManualMultipleContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Info,
  ShoppingCart,
  X,
  Image as ImageIcon
} from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';
// ... el resto de tus imports igual que antes

interface Inscripcion {
  id: number;
  cursoId: number;
  montoCurso: number;
  curso: {
    nombre: string;
    codigoCurso: string;
  };
}

export default function PagoManualMultiplePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inscripcionIdsParam = searchParams.get('inscripciones');
  const metodoParam = searchParams.get('metodo') || 'yape';
  
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Datos del formulario
  const [metodoPago, setMetodoPago] = useState(metodoParam);
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [fechaOperacion, setFechaOperacion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [observaciones, setObservaciones] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string>('');

  const [totalPagar, setTotalPagar] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [totalConDescuento, setTotalConDescuento] = useState(0);

  useEffect(() => {
    cargarInscripciones();
  }, []);



  const cargarInscripciones = async () => {
    try {
      if (!inscripcionIdsParam) {
        setError('No se especificaron inscripciones');
        setLoading(false);
        return;
      }

      const idsArray = inscripcionIdsParam.split(',').map(id => parseInt(id));
      const response = await apiClient.get('/inscripciones/pendientes-pago');
      
      if (response.data.success) {
        const todasInscripciones = response.data.data.inscripciones;
        const inscripcionesFiltradas = todasInscripciones.filter(
          (insc: Inscripcion) => idsArray.includes(insc.id)
        );
        
        setInscripciones(inscripcionesFiltradas);
        calcularTotales(inscripcionesFiltradas);
      }
    } catch (err: any) {
      console.error('Error cargando inscripciones:', err);
      setError(err.response?.data?.message || 'Error al cargar las inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = (inscripciones: Inscripcion[]) => {
    const total = inscripciones.reduce(
      (sum, insc) => sum + Number(insc.montoCurso), 
      0
    );
    
    let desc = 0;
    const cantidadCursos = inscripciones.length;
    
    if (cantidadCursos >= 12) {
      desc = total * 0.10;
    } else if (cantidadCursos >= 6) {
      desc = total * 0.05;
    }

    setTotalPagar(total);
    setDescuento(desc);
    setTotalConDescuento(total - desc);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes (JPG, PNG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }

      setComprobante(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewComprobante(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setComprobante(null);
    setPreviewComprobante('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!comprobante) {
    setError('Debes subir el comprobante de pago');
    return;
  }

  if (!numeroOperacion.trim()) {
    setError('Debes ingresar el número de operación');
    return;
  }

  if (inscripciones.length === 0) {
    setError('No hay cursos para pagar');
    return;
  }

  setEnviando(true);
  setError('');

  try {
    const formData = new FormData();
    formData.append('comprobante', comprobante);
    
    // NO enviar tipoPago, idReferencia - el backend los manejará
    formData.append('monto', totalConDescuento.toString());
    formData.append('metodoPago', metodoPago);
    formData.append('numeroOperacion', numeroOperacion.trim());
    formData.append('fechaOperacion', fechaOperacion);
    
    // Enviar TODOS los IDs de inscripciones
    const inscripcionesIds = inscripciones.map(insc => insc.id);
    formData.append('inscripcionesIds', JSON.stringify(inscripcionesIds));
    
    if (observaciones.trim()) {
      formData.append('observaciones', observaciones.trim());
    }

    console.log('📤 Enviando pago múltiple:', {
      monto: totalConDescuento,
      metodo: metodoPago,
      numOperacion: numeroOperacion,
      cantidadCursos: inscripcionesIds.length,
      cursosIds: inscripcionesIds
    });

    // Usar el nuevo endpoint para pagos múltiples
    const response = await apiClient.post('/pagos/manual-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Respuesta:', response.data);

    if (response.data.success) {
      setExito(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } else {
      setError(response.data.message || 'Error al procesar el pago');
    }
  } catch (err: any) {
    console.error('❌ Error completo:', err);
    console.error('📄 Respuesta del error:', err.response?.data);
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error ||
                        err.message ||
                        'Error al enviar el comprobante';
    setError(errorMessage);
  } finally {
    setEnviando(false);
  }
};

  if (loading) {
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

  if (exito) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡Comprobante Enviado!</h2>
              <p className="text-gray-600 mb-4">
                Tu comprobante de pago múltiple ha sido recibido correctamente.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>{inscripciones.length} cursos</strong> serán activados después 
                  de que el administrador verifique tu pago (máximo 24 horas).
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')}>
                Ir a Mis Cursos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inscripciones.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>No hay cursos para pagar</CardTitle>
            <CardDescription>No se encontraron inscripciones pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/estudiante/cursos')}>
              Ver Cursos Disponibles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Enviar Comprobante - Pago Sin Comisión
            </CardTitle>
            <CardDescription>
              Pago de {inscripciones.length} cursos - Sin comisiones adicionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Resumen de cursos */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Cursos a Pagar:</h3>
              <div className="space-y-2">
                {inscripciones.map((inscripcion) => (
                  <Card key={inscripcion.id} className="bg-gray-50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{inscripcion.curso.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {inscripcion.curso.codigoCurso}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${Number(inscripcion.montoCurso).toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({inscripciones.length} cursos):</span>
                  <span>${totalPagar.toFixed(2)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({inscripciones.length >= 12 ? '10%' : '5%'}):</span>
                    <span>-${descuento.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-purple-600">
                    ${totalConDescuento.toFixed(2)}
                  </span>
                </div>
                <Badge variant="outline" className="mt-2 bg-green-100 text-green-800">
                  ✓ Sin comisión adicional
                </Badge>
              </div>
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Instrucciones para Pago Sin Comisión:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Realiza UN SOLO pago por el monto total: ${totalConDescuento.toFixed(2)}</li>
                    <li>Sube una foto clara del comprobante o captura de pantalla</li>
                    <li>Incluye el número de operación exacto</li>
                    <li>Todos los cursos se activarán al verificar el pago</li>
                    <li>Tiempo de verificación: máximo 24 horas hábiles</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Método de pago */}
              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de Pago Utilizado *</Label>
                <select
                  id="metodoPago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="yape">Yape</option>
                  <option value="transferencia_bancaria">Transferencia Bancaria</option>
                </select>
              </div>

              {/* Número de operación */}
              <div className="space-y-2">
                <Label htmlFor="numeroOperacion">
                  Número de Operación *
                </Label>
                <Input
                  id="numeroOperacion"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="Ej: 123456789"
                  required
                />
                <p className="text-xs text-gray-500">
                  Ingresa el número que aparece en tu comprobante
                </p>
              </div>

              {/* Fecha de operación */}
              <div className="space-y-2">
                <Label htmlFor="fechaOperacion">
                  Fecha de Operación *
                </Label>
                <Input
                  id="fechaOperacion"
                  type="date"
                  value={fechaOperacion}
                  onChange={(e) => setFechaOperacion(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Comprobante */}
              <div className="space-y-2">
                <Label htmlFor="comprobante">Comprobante de Pago *</Label>
                {previewComprobante ? (
                  <div className="relative border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={previewComprobante}
                          alt="Comprobante"
                          className="max-h-96 mx-auto rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Imagen cargada correctamente
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                      id="comprobante"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="comprobante"
                      className="cursor-pointer block"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="p-4 bg-purple-100 rounded-full">
                            <Upload className="h-8 w-8 text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-purple-600 font-medium hover:text-purple-700">
                            Haz clic para subir tu comprobante
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            o arrastra y suelta aquí
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                          <ImageIcon className="h-4 w-4" />
                          <span>PNG, JPG, JPEG hasta 5MB</span>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">
                  Observaciones (Opcional)
                </Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agrega cualquier comentario adicional sobre tu pago..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Resumen final */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Resumen del Pago</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cursos:</span>
                    <span className="font-medium">{inscripciones.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método:</span>
                    <span className="font-medium capitalize">
                      {metodoPago.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de Operación:</span>
                    <span className="font-medium">{numeroOperacion || '-'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Pagado:</span>
                    <span className="text-green-600">
                      ${totalConDescuento.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={enviando}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={enviando || !comprobante || !numeroOperacion}
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enviar Comprobante
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>
                  Al enviar este comprobante, confirmas que has realizado el pago
                  por el monto indicado y aceptas nuestros términos y condiciones.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 96cf58b8dcf4eea4fd6730b517146d98d4014f2c
