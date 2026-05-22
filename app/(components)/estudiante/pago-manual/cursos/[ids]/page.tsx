// app/estudiante/pago-manual/cursos/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  FileText,
  ArrowLeft,
  Info
} from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';

interface Inscripcion {
  id: number;
  cursoId: number;
  montoCurso: number;
  estadoPago: string;
  curso: {
    nombre: string;
    codigoCurso: string;
    precio: number;
  };
}

export default function PagoManualCursoPage() {
  const params = useParams();
  const router = useRouter();
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Datos del formulario
  const [metodoPago, setMetodoPago] = useState('yape');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string>('');

  useEffect(() => {
    cargarInscripcion();
  }, [params.id]);

  const cargarInscripcion = async () => {
    try {
      const response = await apiClient.get(`/inscripciones/${params.id}`);
      
      if (response.data.success) {
        setInscripcion(response.data.data);
        
        // Verificar si ya está pagado
        if (response.data.data.estadoPago === 'pagado') {
          router.push(`/cursos/${response.data.data.cursoId}`);
        }
      } else {
        setError('No se pudo cargar la información del curso');
      }
    } catch (err: any) {
      console.error('Error cargando inscripción:', err);
      setError(err.response?.data?.message || 'Error al cargar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes (JPG, PNG, etc.)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }

      setComprobante(file);
      setError('');

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewComprobante(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!comprobante) {
      setError('Debes subir el comprobante de pago');
      return;
    }

    if (!referenciaPago.trim()) {
      setError('Debes ingresar el número de operación o referencia');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      // Convertir imagen a base64
      const reader = new FileReader();
      reader.readAsDataURL(comprobante);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Enviar comprobante y confirmar pago
        const response = await apiClient.post(`/inscripciones/${params.id}/confirmar-pago`, {
          metodoPago,
          referenciaPago: referenciaPago.trim(),
          observaciones: observaciones.trim(),
          comprobante: base64Image
        });

        if (response.data.success) {
          setExito(true);
          
          // Redirigir después de 3 segundos
          setTimeout(() => {
            router.push('/estudiante/mis-cursos');
          }, 3000);
        } else {
          setError(response.data.message || 'Error al confirmar el pago');
        }
      };

      reader.onerror = () => {
        setError('Error al procesar la imagen');
        setEnviando(false);
      };
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al enviar el comprobante');
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
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
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡Comprobante Enviado!</h2>
              <p className="text-gray-600 mb-4">
                Tu comprobante ha sido recibido correctamente.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  El pago será verificado por el administrador en las próximas 24 horas.
                  Recibirás una notificación cuando tu curso sea activado.
                </p>
              </div>
              <Button onClick={() => router.push('/estudiante/mis-cursos')}>
                Ir a Mis Cursos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inscripcion) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se encontró la inscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/estudiante/cursos')}>
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
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
            <CardTitle>Enviar Comprobante de Pago</CardTitle>
            <CardDescription>
              Completa la información del pago realizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Información del curso */}
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {inscripcion.curso.nombre}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {inscripcion.curso.codigoCurso}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">
                    ${Number(inscripcion.montoCurso).toFixed(2)}
                  </p>
                  <Badge variant="outline">Sin comisión</Badge>
                </div>
              </div>
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Instrucciones:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Realiza el pago por el método seleccionado</li>
                    <li>Sube una foto clara del comprobante o captura de pantalla</li>
                    <li>Incluye el número de operación o referencia</li>
                    <li>El pago será verificado en un máximo de 24 horas</li>
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
                  <option value="plin">Plin</option>
                  <option value="deposito">Depósito en Efectivo</option>
                </select>
              </div>

              {/* Número de operación */}
              <div className="space-y-2">
                <Label htmlFor="referenciaPago">
                  Número de Operación / Referencia *
                </Label>
                <Input
                  id="referenciaPago"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  placeholder="Ej: 123456789"
                  required
                />
                <p className="text-xs text-gray-500">
                  Ingresa el número que aparece en tu comprobante
                </p>
              </div>

              {/* Comprobante */}
              <div className="space-y-2">
                <Label htmlFor="comprobante">Comprobante de Pago *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewComprobante ? (
                    <div className="space-y-4">
                      <img
                        src={previewComprobante}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setComprobante(null);
                            setPreviewComprobante('');
                          }}
                        >
                          Cambiar Imagen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <label
                        htmlFor="comprobante"
                        className="cursor-pointer text-purple-600 hover:text-purple-700"
                      >
                        Haz clic para subir una imagen
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG hasta 5MB
                      </p>
                    </div>
                  )}
                  <input
                    id="comprobante"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
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

              {/* Resumen */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Resumen del Pago</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Curso:</span>
                    <span className="font-medium">{inscripcion.curso.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método:</span>
                    <span className="font-medium capitalize">
                      {metodoPago.replace('_', ' ')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Pagado:</span>
                    <span className="text-green-600">
                      ${Number(inscripcion.montoCurso).toFixed(2)}
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
                  className="flex-1"
                  disabled={enviando || !comprobante}
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
                  por el monto indicado.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}