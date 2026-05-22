'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InfoIcon, CreditCard, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/app/src/lib/api/client';

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
      // Primero, intenta obtener la matrícula desde el endpoint específico
      const response = await apiClient.get(`/matriculas/mi-matricula`);
      
      if (response.data.success) {
        const data: MatriculaResponse = response.data.data;
        console.log('Data recibida:', data); // Para debug
        
        setMatricula(data.matricula);
        
        // Verificar si hay métodos de pago y si es un array
        if (data.metodosPago && Array.isArray(data.metodosPago)) {
          setMetodosPago(data.metodosPago);
          
          // Seleccionar el primer método por defecto
          if (data.metodosPago.length > 0) {
            setMetodoPago(data.metodosPago[0].metodoPago);
          }
        } else {
          // Si no hay métodos de pago en la respuesta, usa métodos por defecto
          setMetodosPago(crearMetodosPagoPorDefecto(data.matricula?.montoMatricula || 50));
          setMetodoPago('stripe');
        }
        
        setDataCargada(true);
      } else {
        setError(response.data.message || 'Error al cargar la matrícula');
      }
    } catch (err: any) {
      console.error('Error cargando matrícula:', err);
      
      // Si hay error, usar métodos por defecto
      setMetodosPago(crearMetodosPagoPorDefecto(50));
      setMetodoPago('stripe');
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
        comision: (montoBase * 0.03).toFixed(2), // 3% de comisión
        montoBase: montoBase.toFixed(2),
        montoFinal: (montoBase * 1.03).toFixed(2), // monto + 3%
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando métodos de pago...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dataCargada && metodosPago.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar la información de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-red-700">
                    {error || 'No se encontraron métodos de pago disponibles. Por favor, contacta al administrador.'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Volver al Dashboard
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
                Monto base: ${(matricula?.montoMatricula || 50).toFixed(2)}
                {matricula?.estadoPago && (
                  <span className="ml-2">
                    | Estado: <Badge variant="outline">{matricula.estadoPago}</Badge>
                  </span>
                )}
              </p>
            </div>

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