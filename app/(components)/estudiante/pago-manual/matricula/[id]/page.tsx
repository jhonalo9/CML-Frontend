// app/estudiante/pago-manual/matricula/[id]/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileImage, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Camera,
  FileText,
  CreditCard,
  Banknote
} from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';

interface FormData {
  metodoPago: 'yape' | 'transferencia_bancaria';
  numeroOperacion: string;
  fechaOperacion?: string;
  notas?: string;
}

export default function PagoManualMatriculaPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    metodoPago: 'yape',
    numeroOperacion: '',
    fechaOperacion: new Date().toISOString().split('T')[0],
    notas: ''
  });
  
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pagoData, setPagoData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Solo JPG, PNG, PDF o WebP.');
      return;
    }

    setComprobanteFile(file);
    setError('');

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setComprobantePreview(null);
    }
  };

  const removeFile = () => {
    setComprobanteFile(null);
    setComprobantePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validaciones
  if (!comprobanteFile) {
    setError('Debes subir el comprobante de pago');
    setLoading(false);
    return;
  }

  if (!formData.numeroOperacion.trim()) {
    setError('Debes proporcionar el número de operación');
    setLoading(false);
    return;
  }

  // ✅ SOLUCIÓN: Obtener y validar el ID de matrícula correctamente
  let matriculaIdFinal: number | null = null;



    if (params.id && params.id !== 'undefined' && params.id !== 'null') {
    const parsed = typeof params.id === 'string' ? parseInt(params.id, 10) : params.id;
    if (!isNaN(parsed as number) && (parsed as number) > 0) {
      matriculaIdFinal = parsed as number;
    }
  }

  // Si no hay ID válido en params, obtenerlo del backend
  if (!matriculaIdFinal) {
    try {
      console.log('📡 Obteniendo matrícula del backend...');
      const matriculaResponse = await apiClient.get('/matriculas/mi-matricula');
      
      if (matriculaResponse.data.success) {
        matriculaIdFinal = matriculaResponse.data.data.id;
        console.log('✅ Matrícula obtenida:', matriculaIdFinal);
      } else {
        setError('No tienes una matrícula activa');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('❌ Error obteniendo matrícula:', err);
      setError('Error al obtener la matrícula: ' + (err.response?.data?.message || err.message));
      setLoading(false);
      return;
    }
  }


  if (!matriculaIdFinal || matriculaIdFinal <= 0) {
    setError('No se pudo obtener un ID de matrícula válido');
    setLoading(false);
    return;
  }

  try {
    // Preparar FormData
    const formDataToSend = new FormData();
    formDataToSend.append('comprobante', comprobanteFile);
    formDataToSend.append('tipoPago', 'matricula');
    formDataToSend.append('idReferencia', matriculaIdFinal.toString()); // ✅ Ahora es un número válido
    formDataToSend.append('monto', '50.00');
    formDataToSend.append('metodoPago', formData.metodoPago);
    formDataToSend.append('numeroOperacion', formData.numeroOperacion);
    
    if (formData.fechaOperacion) {
      formDataToSend.append('fechaOperacion', formData.fechaOperacion);
    }
    
    if (formData.notas && formData.notas.trim()) {
      formDataToSend.append('notas', formData.notas);
    }

    console.log('📤 Enviando pago manual...');
    console.log('- Matrícula ID:', matriculaIdFinal);
    console.log('- Método:', formData.metodoPago);
    console.log('- Operación:', formData.numeroOperacion);

    // Configurar axios con progreso
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          setUploading(true);
        }
      },
    };

    // Enviar al endpoint
    const response = await apiClient.post('/pagos/manual', formDataToSend, config);

    console.log('✅ Respuesta recibida:', response.data);
    setUploading(false);

    if (response.data.success) {
      setPagoData(response.data.data);
      setSuccess(true);
      
      // Redirigir después de 5 segundos
      setTimeout(() => {
        router.push('/estudiante/cursos');
      }, 5000);
    } else {
      setError(response.data.message || 'Error al registrar el pago');
    }
  } catch (err: any) {
    console.error('❌ Error al procesar pago:', err);
    setError(err.response?.data?.message || err.message || 'Error al procesar el pago');
  } finally {
    setLoading(false);
    setUploading(false);
  }
  };

  const handleViewComprobante = () => {
    if (comprobantePreview) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Comprobante de Pago</title></head>
            <body style="margin: 0; padding: 0; text-align: center; background: #f5f5f5;">
              <img src="${comprobantePreview}" style="max-width: 100%; max-height: 90vh;" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  if (success && pagoData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              ¡Pago Registrado Exitosamente!
            </CardTitle>
            <CardDescription>
              Tu pago de matrícula está siendo validado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Código de Transacción:</span>
                  <Badge variant="outline">{pagoData.codigoTransaccion}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estado:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Pendiente de validación
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Monto:</span>
                  <span className="font-bold">S/. 50.00</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-700">
                <strong>Importante:</strong> Tu pago será verificado por un administrador.
                Recibirás una notificación cuando sea confirmado.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Tiempo estimado: 24-48 horas hábiles
              </p>
            </div>

            <div className="text-center space-y-3">
              <p className="text-gray-600">
                Redirigiendo a la selección de cursos en 5 segundos...
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                >
                  Ir al Dashboard
                </Button>
                <Button 
                  onClick={() => router.push('/estudiante/cursos')}
                >
                  Ir a Cursos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Pago Manual - Matrícula
          </CardTitle>
          <CardDescription>
            Sube tu comprobante y registra los datos del pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumen del pago */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Pago de Matrícula</p>
                  <p className="text-sm text-gray-600">
                    Código: MAT-{new Date().getFullYear()}-{params.id?.toString().padStart(6, '0')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">S/. 50.00</p>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Sin comisión
                  </Badge>
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Método de Pago</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    formData.metodoPago === 'yape' 
                      ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, metodoPago: 'yape'})}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Yape</p>
                        <p className="text-sm text-gray-500">Pago por celular</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${
                    formData.metodoPago === 'transferencia_bancaria' 
                      ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, metodoPago: 'transferencia_bancaria'})}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Transferencia Bancaria</p>
                        <p className="text-sm text-gray-500">Pago bancario</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sección de subida de comprobante */}
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-medium mb-2 block">
                  Comprobante de Pago *
                </Label>
                <p className="text-sm text-gray-500 mb-4">
                  Sube una foto o captura de pantalla de tu comprobante de pago
                </p>
                
                {/* Área de subida */}
                {!comprobanteFile ? (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Sube tu comprobante</p>
                    <p className="text-sm text-gray-500">
                      Haz clic para subir una imagen o PDF
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Formatos: JPG, PNG, PDF (Máx. 5MB)
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Preview del archivo */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {comprobanteFile.type.startsWith('image/') ? (
                            <FileImage className="h-8 w-8 text-blue-600" />
                          ) : (
                            <FileText className="h-8 w-8 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium">{comprobanteFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comprobantePreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleViewComprobante}
                              className="h-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Preview de imagen */}
                      {comprobantePreview && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Vista previa:</p>
                          <div className="border rounded-lg overflow-hidden max-w-md mx-auto">
                            <img
                              src={comprobantePreview}
                              alt="Preview del comprobante"
                              className="w-full h-auto max-h-64 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Progreso de subida */}
                      {uploading && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Subiendo...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Cambiar Archivo
                    </Button>
                  </div>
                )}
              </div>

              {/* Datos del pago */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroOperacion">Número de Operación *</Label>
                  <Input
                    id="numeroOperacion"
                    value={formData.numeroOperacion}
                    onChange={(e) => setFormData({...formData, numeroOperacion: e.target.value})}
                    placeholder="Ej: 123456789, código Yape, número de operación bancaria"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Ingresa el número que aparece en tu comprobante
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaOperacion">Fecha de la Operación</Label>
                  <Input
                    id="fechaOperacion"
                    type="date"
                    value={formData.fechaOperacion}
                    onChange={(e) => setFormData({...formData, fechaOperacion: e.target.value})}
                  />
                  <p className="text-sm text-gray-500">
                    Fecha en que realizaste el pago (opcional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Ej: Nombre del remitente, hora del pago, observaciones..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Mensajes de error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Instrucciones importantes:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 ml-6">
                <li className="list-disc">
                  Asegúrate de que el comprobante sea legible y muestre claramente:
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>- Monto pagado (S/. 50.00)</li>
                    <li>- Número de operación/referencia</li>
                    <li>- Fecha y hora (si aplica)</li>
                  </ul>
                </li>
                <li className="list-disc">
                  El acceso a los cursos se activará después de la verificación (24-48 horas)
                </li>
                <li className="list-disc">
                  Guarda tu comprobante por cualquier consulta
                </li>
                <li className="list-disc">
                  Tu matrícula se activará automáticamente cuando el pago sea confirmado
                </li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={loading || uploading}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || uploading || !comprobanteFile || !formData.numeroOperacion}
                size="lg"
              >
                {loading || uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploading ? 'Subiendo...' : 'Registrando...'}
                  </div>
                ) : (
                  'Registrar Pago'
                )}
              </Button>
            </div>

            {/* Información de contacto */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>
                ¿Problemas con el pago? Contacta:{' '}
                <a 
                  href="mailto:admin@ministeriolaico.com" 
                  className="text-purple-600 hover:underline font-medium"
                >
                  admin@ministeriolaico.com
                </a>
              </p>
              <p className="mt-1">Teléfono: +51 999 888 777</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}