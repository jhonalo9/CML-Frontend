// app/estudiante/pagar-matricula/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InfoIcon, CreditCard, Banknote, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';
import LoadingSpinner from '@/app/(components)/LoadingSpinner';

 import{ XCircle  // ⬅️ SOLO AGREGAR ESTA LÍNEA
} from 'lucide-react';


interface MetodoPago {
  metodoPago: string;
  nombreTitular?: string;
  numeroCuenta?: string;
  nombreBanco?: string;
  tipoCuenta?: string;
  numeroCelular?: string;
  comisionPorcentaje?: string;
  comisionFija?: string;
  instrucciones?: string;
  esManual: boolean;
  tieneComision: boolean;
  comision: string;
  montoBase: string;
  montoFinal: string;
}

interface MatriculaResponse {
  matricula: {
    id: number;
    codigoMatricula: string;
    montoMatricula: number;
    estadoPago: string;
    activa: boolean;
    metodoPago?: string;
    fechaPago?: string;
  };
  metodosPago?: MetodoPago[];
  mensaje?: string;
}

export default function PagarMatriculaPage() {
  const params = useParams();
  const router = useRouter();
  const [metodoPago, setMetodoPago] = useState<string>('');
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [matricula, setMatricula] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [dataCargada, setDataCargada] = useState(false);

  useEffect(() => {
    cargarMatricula();
  }, [params.id]);

 const cargarMatricula = async () => {
  try {
    setLoading(true);
    setError('');
    
    const response = await apiClient.get(`/matriculas/mi-matricula`);
    
    if (response.data.success) {
      // ✅ La API devuelve directamente el objeto de matrícula, no anidado
      const matriculaData = response.data.data;
      console.log('Data recibida matrícula:', matriculaData);
      
      // Verificar si es un objeto de matrícula directamente o tiene la propiedad matricula
      const matriculaObj = matriculaData.matricula || matriculaData;
      
      setMatricula(matriculaObj);
      
      // ✅ IMPORTANTE: Verificar estado de la matrícula
      if (matriculaObj.estadoPago === 'pagado') {
        // Si ya está pagada, redirigir al dashboard
        console.log('Matrícula ya pagada, redirigiendo...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        return;
      } else if (matriculaObj.estadoPago === 'pendiente') {
        // Si está pendiente y ya tiene método de pago, significa que está en revisión
        if (matriculaObj.metodoPago) {
          console.log('Matrícula con pago pendiente de verificación');
          // Redirigir a página de revisión
          setTimeout(() => {
            router.push('/estudiante/pago-en-revision?tipo=matricula&referencia=' + 
              matriculaObj.codigoMatricula + 
              '&monto=' + matriculaObj.montoMatricula);
          }, 1000);
          return;
        }
      }
      
      // Solo mostrar métodos de pago si realmente necesita pagar
      // Verificar si vienen métodos de pago en la respuesta
      if (matriculaData.metodosPago && Array.isArray(matriculaData.metodosPago)) {
        setMetodosPago(matriculaData.metodosPago);
        
        if (matriculaData.metodosPago.length > 0) {
          setMetodoPago(matriculaData.metodosPago[0].metodoPago);
        }
      } else {
        // Crear métodos de pago por defecto usando el monto de la matrícula
        const montoMatricula = parseFloat(matriculaObj.montoMatricula) || 50;
        setMetodosPago(crearMetodosPagoPorDefecto(montoMatricula));
        setMetodoPago('stripe');
      }
      
      setDataCargada(true);
    } else {
      setError(response.data.message || 'Error al cargar la matrícula');
    }
  } catch (err: any) {
    console.error('Error cargando matrícula:', err);
    setError(err.response?.data?.message || 'Error al cargar la información de pago');
  } finally {
    setLoading(false);
  }
};

  // Función para crear métodos de pago por defecto
  const crearMetodosPagoPorDefecto = (montoBase: number): MetodoPago[] => {
    return [
      {
        metodoPago: 'stripe',
        esManual: false,
        tieneComision: true,
        comision: (montoBase * 0.03).toFixed(2),
        montoBase: montoBase.toFixed(2),
        montoFinal: (montoBase * 1.03).toFixed(2),
        instrucciones: 'Pago con tarjeta de crédito/débito'
      },
      {
        metodoPago: 'yape',
        nombreTitular: 'Ministerio Laico',
        numeroCelular: '999888777',
        esManual: true,
        tieneComision: false,
        comision: '0.00',
        montoBase: montoBase.toFixed(2),
        montoFinal: montoBase.toFixed(2),
        instrucciones: 'Realiza el pago por Yape y envía el comprobante'
      },
      {
        metodoPago: 'transferencia_bancaria',
        nombreTitular: 'Ministerio Laico',
        nombreBanco: 'BCP',
        numeroCuenta: '0011-1234-5678-9012',
        tipoCuenta: 'Ahorros',
        esManual: true,
        tieneComision: false,
        comision: '0.00',
        montoBase: montoBase.toFixed(2),
        montoFinal: montoBase.toFixed(2),
        instrucciones: 'Realiza la transferencia y envía el comprobante'
      }
    ];
  };

  const handlePagar = async () => {
    if (!metodoPago) {
      setError('Por favor, selecciona un método de pago');
      return;
    }

    setProcesando(true);
    setError('');
    
    try {
      const metodoSeleccionado = metodosPago.find(m => m.metodoPago === metodoPago);
      
      if (!metodoSeleccionado) {
        throw new Error('Método de pago no válido');
      }

      if (metodoSeleccionado.esManual) {
        // Pago manual sin comisión (con comprobante)
        router.push(`/estudiante/pago-manual/matricula/${params.id}`);
      } else {
        // Pago automático con comisión (sin comprobante)
        const response = await apiClient.post('/pagos/stripe', {
          tipo: 'matricula',
          idReferencia: params.id,
          monto: parseFloat(metodoSeleccionado.montoFinal),
          descripcion: 'Pago de matrícula'
        });

        if (response.data.success) {
          window.location.href = response.data.data.checkoutUrl;
        } else {
          setError(response.data.message || 'Error al crear pago');
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  const getMetodoPagoInfo = (metodo: MetodoPago) => {
    switch (metodo.metodoPago) {
      case 'stripe':
        return {
          title: 'Tarjeta de Crédito/Débito',
          subtitle: 'Pago automático, sin necesidad de enviar comprobante',
          icon: <CreditCard className="h-5 w-5" />,
          badge: 'Rápido y seguro'
        };
      case 'yape':
        return {
          title: 'Yape',
          subtitle: 'Pago manual, debes enviar comprobante',
          icon: <Banknote className="h-5 w-5" />,
          badge: 'Sin comisión'
        };
      case 'transferencia_bancaria':
        return {
          title: 'Transferencia Bancaria',
          subtitle: 'Pago manual, debes enviar comprobante',
          icon: <Banknote className="h-5 w-5" />,
          badge: 'Sin comisión'
        };
      default:
        return {
          title: metodo.metodoPago,
          subtitle: metodo.instrucciones || 'Método de pago',
          icon: <Banknote className="h-5 w-5" />,
          badge: ''
        };
    }
  };

  // Mostrar pantalla de carga mientras se verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          text="Verificando estado de matrícula..."
          size="lg"
        />
      </div>
    );
  }

  // Si la matrícula ya está pagada, mostrar mensaje y redirigir
  if (matricula?.estadoPago === 'pagado') {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle>¡Matrícula Pagada!</CardTitle>
            <CardDescription>
              Tu matrícula ya está activa y pagada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Código de matrícula: <strong>{matricula.codigoMatricula}</strong>
              </p>
              <p className="text-gray-600">
                Estado: <Badge className="bg-green-100 text-green-800">Pagado</Badge>
              </p>
              {matricula.fechaPago && (
                <p className="text-sm text-gray-500">
                  Pagado el: {new Date(matricula.fechaPago).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button 
              className="w-full" 
              onClick={() => router.push('/dashboard')}
            >
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si la matrícula está pendiente con método de pago (en revisión)
  if (matricula?.estadoPago === 'pendiente' && matricula?.metodoPago) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <CardTitle>Pago en Revisión</CardTitle>
            <CardDescription>
              Tu pago de matrícula está siendo verificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <InfoIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Información del pago:</p>
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      <li>Código: {matricula.codigoMatricula}</li>
                      <li>Monto: ${matricula.montoMatricula}</li>
                      <li>Método: {matricula.metodoPago}</li>
                      <li>Estado: Pendiente de verificación</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Tu comprobante de pago está siendo revisado por nuestro equipo administrativo.
                Te notificaremos cuando la verificación esté completa.
              </p>
              
              <p className="text-sm text-gray-500">
                Tiempo estimado: 24-48 horas hábiles
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/estudiante/pago-en-revision?tipo=matricula')}
              >
                Ver Estado
              </Button>
              <Button 
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Solo mostrar opciones de pago si realmente necesita pagar
  if (!dataCargada && metodosPago.length === 0) {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Información de Matrícula</CardTitle>
          <CardDescription>
            {matricula ? 'Estado de tu matrícula' : 'No se pudo cargar la información'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Aviso importante</p>
                    <p className="text-yellow-700 mt-1">
                      {error || 'Hubo un problema al cargar la información. Puedes intentar pagar usando los métodos por defecto.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {matricula && (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Matrícula: {matricula.codigoMatricula}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge variant="outline" className={
                      matricula.estadoPago === 'pagado' ? 'bg-green-100 text-green-800' :
                      matricula.estadoPago === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {matricula.estadoPago === 'pagado' ? 'Pagado' :
                       matricula.estadoPago === 'pendiente' ? 'Pendiente' : 'Desconocido'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={cargarMatricula}
                variant="outline"
                className="w-full"
              >
                Reintentar Carga
              </Button>
              
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

if (matricula?.estadoPago === 'rechazado') {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-red-700">Pago Rechazado</CardTitle>
          <CardDescription>
            Tu pago de matrícula fue rechazado por nuestro equipo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Motivo del rechazo:</p>
                <p className="text-red-700 mt-1">
                  {matricula.motivoRechazo || 'El comprobante de pago no pudo ser verificado. Por favor, intenta nuevamente con un comprobante válido.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <strong>¿Qué hacer ahora?</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Verifica que el comprobante sea legible y contenga todos los datos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Asegúrate de que el monto pagado sea el correcto</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Si pagaste correctamente, contacta a soporte para resolver el problema</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Información de la matrícula:
            </p>
            <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
              <p><strong>Código:</strong> {matricula.codigoMatricula}</p>
              <p><strong>Monto:</strong> S/. {matricula.montoMatricula}</p>
              <p><strong>Estado:</strong> <Badge variant="outline" className="bg-red-100 text-red-800">Rechazado</Badge></p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open('mailto:soporte@ministeriolaico.com?subject=Pago rechazado - ' + matricula.codigoMatricula, '_blank')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Contactar Soporte
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                // Continuar para intentar pagar nuevamente
                setDataCargada(true);
                setError('');
              }}
            >
              Intentar Nuevamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Pagar Matrícula</CardTitle>
          <CardDescription>
            Selecciona tu método de pago preferido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Resumen de la matrícula */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-semibold">Matrícula: {matricula?.codigoMatricula || 'N/A'}</p>
              <p className="text-sm text-gray-600">
                Monto base: ${(parseFloat(matricula?.montoMatricula) || 50).toFixed(2)}
                <span className="ml-2">
                  | Estado: <Badge variant="outline">Pendiente de pago</Badge>
                </span>
              </p>
            </div>

            {/* ... resto del código de selección de métodos de pago ... */}
            {/* (mantén todo el código de selección de métodos de pago igual) */}

            
            
            {/* Explicación de las opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold">Con Comisión</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pago automático. Sin necesidad de enviar comprobante. Incluye comisión por servicio.
                  </p>
                  <Badge className="mt-2" variant="outline">
                    + Comisión aplicada
                  </Badge>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold">Sin Comisión</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pago manual. Debes enviar comprobante. Sin comisión adicional.
                  </p>
                  <Badge className="mt-2 bg-green-100 text-green-800" variant="outline">
                    Sin comisión
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Selección de método de pago */}
            <div className="space-y-4">
              <Label className="text-lg">Selecciona tu método de pago:</Label>
              
              {metodosPago.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-700">
                      No hay métodos de pago disponibles. Usando métodos por defecto.
                    </p>
                  </div>
                </div>
              ) : (
                <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
                  {metodosPago.map((metodo) => {
                    const info = getMetodoPagoInfo(metodo);
                    const montoFinal = parseFloat(metodo.montoFinal);
                    const montoBase = parseFloat(metodo.montoBase);
                    const comision = parseFloat(metodo.comision);
                    
                    return (
                      <div key={metodo.metodoPago} className="space-y-3">
                        <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                          metodoPago === metodo.metodoPago 
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setMetodoPago(metodo.metodoPago)}
                        >
                          <RadioGroupItem 
                            value={metodo.metodoPago} 
                            id={metodo.metodoPago} 
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                              <div>
                                <Label 
                                  htmlFor={metodo.metodoPago} 
                                  className="font-medium cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {info.icon}
                                    <span>{info.title}</span>
                                    {info.badge && (
                                      <Badge variant="secondary" className="text-xs">
                                        {info.badge}
                                      </Badge>
                                    )}
                                  </div>
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                  {info.subtitle}
                                </p>
                                {metodo.instrucciones && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {metodo.instrucciones}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="space-y-1">
                                  <p className="text-2xl font-bold">
                                    ${montoFinal.toFixed(2)}
                                  </p>
                                  {metodo.tieneComision && comision > 0 && (
                                    <div className="text-sm text-gray-500">
                                      <span className="line-through">${montoBase.toFixed(2)}</span>
                                      <span className="text-red-600 ml-2">
                                        +${comision.toFixed(2)} comisión
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Detalles del método de pago */}
                        {metodoPago === metodo.metodoPago && metodo.esManual && (
                          <div className="ml-8 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-800">Detalles para pago manual:</p>
                                {metodo.nombreTitular && (
                                  <p><strong>Titular:</strong> {metodo.nombreTitular}</p>
                                )}
                                {(metodo.numeroCuenta || metodo.numeroCelular) && (
                                  <p>
                                    <strong>Número:</strong> {metodo.numeroCuenta || metodo.numeroCelular}
                                  </p>
                                )}
                                {metodo.nombreBanco && (
                                  <p><strong>Banco:</strong> {metodo.nombreBanco}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </div>

            <Separator />

            {/* Resumen del pago */}
            {metodoPago && metodosPago.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resumen del pago</h4>
                {metodosPago
                  .filter(m => m.metodoPago === metodoPago)
                  .map(metodo => {
                    const montoFinal = parseFloat(metodo.montoFinal);
                    const montoBase = parseFloat(metodo.montoBase);
                    const comision = parseFloat(metodo.comision);
                    
                    return (
                      <div key={metodo.metodoPago} className="space-y-2">
                        <div className="flex justify-between">
                          <span>Monto de matrícula:</span>
                          <span>${montoBase.toFixed(2)}</span>
                        </div>
                        {metodo.tieneComision && comision > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Comisión por servicio:</span>
                            <span>+${comision.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total a pagar:</span>
                          <span className="text-green-600">
                            ${montoFinal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handlePagar} 
              className="w-full"
              disabled={procesando || !metodoPago || metodosPago.length === 0}
              size="lg"
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : metodoPago && metodosPago.length > 0 ? (
                `Pagar $${metodosPago.find(m => m.metodoPago === metodoPago)?.montoFinal || '0.00'}`
              ) : (
                'No hay métodos de pago disponibles'
              )}
            </Button>

            <div className="text-sm text-gray-500 space-y-2">
              <p className="text-center">
                {metodoPago && metodosPago.find(m => m.metodoPago === metodoPago)?.esManual
                  ? 'Después del pago, sube tu comprobante para activar la matrícula'
                  : 'Pago instantáneo, activación inmediata después de la confirmación'
                }
              </p>
              <p className="text-center text-xs">
                Código de matrícula: {matricula?.codigoMatricula || 'No disponible'}
              </p>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}