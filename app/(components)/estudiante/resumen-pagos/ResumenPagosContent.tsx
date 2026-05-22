// app/estudiante/resumen-pagos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import apiClient from '@/app/src/lib/api/client';
import { 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  Calendar,
  FileText,
  ArrowRight,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

interface Inscripcion {
  id: number;
  cursoId: number;
  curso: {
    nombre: string;
    codigoCurso: string;
    precio: number;
    imagenPortada?: string;
  };
  estadoPago: 'pendiente' | 'pagado' | 'cancelado';
  metodoPago?: string;
  montoCurso: number;
  fechaInscripcion: string;
}

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

interface ResumenResponse {
  inscripciones: Inscripcion[];
  metodosPago?: MetodoPago[];
  resumen?: {
    cantidad: number;
    subtotal: number;
    descuento: number;
    porcentajeDescuento: number;
    montoConDescuento: number;
  };
  mensaje?: string;
}

export default function ResumenPagosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inscripcionIdsParam = searchParams.get('inscripciones');
  
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('');
  const [tipoMetodoPago, setTipoMetodoPago] = useState<'manual' | 'gateway'>('manual');
  const [loading, setLoading] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [error, setError] = useState('');
  const [dataCargada, setDataCargada] = useState(false);

  // Resumen calculado
  const [resumen, setResumen] = useState({
    cantidad: 0,
    subtotal: 0,
    descuento: 0,
    porcentajeDescuento: 0,
    montoConDescuento: 0
  });

  useEffect(() => {
    cargarResumen();
  }, []);

  useEffect(() => {
    if (metodoPagoSeleccionado) {
      const metodo = metodosPago.find(m => m.metodoPago === metodoPagoSeleccionado);
      if (metodo) {
        setTipoMetodoPago(metodo.esManual ? 'manual' : 'gateway');
      }
    }
  }, [metodoPagoSeleccionado, metodosPago]);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Construir URL con parámetros si existen
      let url = '/inscripciones/pendientes-pago';
      if (inscripcionIdsParam) {
        url = `/inscripciones/pendientes-pago?ids=${inscripcionIdsParam}`;
      }

      const response = await apiClient.get(url);
      
      if (response.data.success) {
        const data: ResumenResponse = response.data.data;
        console.log('Data recibida para cursos:', data); // Para debug
        
        // Establecer inscripciones
        if (data.inscripciones && Array.isArray(data.inscripciones)) {
          setInscripciones(data.inscripciones);
          
          // Calcular resumen si no viene del backend
          if (data.resumen) {
            setResumen(data.resumen);
          } else {
            calcularResumen(data.inscripciones);
          }
        } else {
          setInscripciones([]);
        }
        
        // Verificar métodos de pago
        if (data.metodosPago && Array.isArray(data.metodosPago) && data.metodosPago.length > 0) {
          // Calcular montos para cada método de pago
          const montoBase = data.resumen?.montoConDescuento || resumen.montoConDescuento;
          const metodosConMonto = calcularMontosParaMetodos(data.metodosPago, montoBase);
          setMetodosPago(metodosConMonto);
          
          // Seleccionar el primer método por defecto
          if (metodosConMonto.length > 0) {
            const primerMetodo = metodosConMonto[0];
            setMetodoPagoSeleccionado(primerMetodo.metodoPago);
          }
        } else {
          // Si no hay métodos de pago en la respuesta, crear por defecto
          const montoBase = data.resumen?.montoConDescuento || resumen.montoConDescuento;
          const metodosPorDefecto = crearMetodosPagoPorDefecto(montoBase);
          setMetodosPago(metodosPorDefecto);
          
          if (metodosPorDefecto.length > 0) {
            setMetodoPagoSeleccionado(metodosPorDefecto[0].metodoPago);
          }
        }
        
        setDataCargada(true);
      } else {
        setError(response.data.message || 'Error al cargar el resumen de pagos');
      }
    } catch (err: any) {
      console.error('Error cargando resumen de cursos:', err);
      
      // Si hay error, usar métodos por defecto
      const metodosPorDefecto = crearMetodosPagoPorDefecto(0);
      setMetodosPago(metodosPorDefecto);
      
      if (metodosPorDefecto.length > 0) {
        setMetodoPagoSeleccionado(metodosPorDefecto[0].metodoPago);
      }
      
      setError(err.response?.data?.message || 'Error al cargar la información de pagos');
    } finally {
      setLoading(false);
    }
  };

  const calcularResumen = (inscripcionesList: Inscripcion[]) => {
    const subtotal = inscripcionesList.reduce((sum, insc) => sum + Number(insc.montoCurso || 0), 0);
    const cantidad = inscripcionesList.length;
    
    // Calcular descuento basado en cantidad de cursos
    let descuento = 0;
    let porcentajeDescuento = 0;
    
    if (cantidad >= 12) {
      porcentajeDescuento = 10;
      descuento = subtotal * 0.10;
    } else if (cantidad >= 6) {
      porcentajeDescuento = 5;
      descuento = subtotal * 0.05;
    } else if (cantidad >= 3) {
      porcentajeDescuento = 2;
      descuento = subtotal * 0.02;
    }
    
    const montoConDescuento = subtotal - descuento;
    
    setResumen({
      cantidad,
      subtotal,
      descuento,
      porcentajeDescuento,
      montoConDescuento
    });
  };

  // Calcular montos para métodos de pago
  const calcularMontosParaMetodos = (metodos: MetodoPago[], montoBase: number): MetodoPago[] => {
    return metodos.map(metodo => {
      let comisionCalculada = 0;
      let montoFinal = montoBase;
      
      if (metodo.comisionPorcentaje) {
        comisionCalculada += montoBase * (Number(metodo.comisionPorcentaje) / 100);
      }
      if (metodo.comisionFija) {
        comisionCalculada += Number(metodo.comisionFija);
      }
      
      montoFinal += comisionCalculada;
      
      const tieneComision = comisionCalculada > 0;
      
      return {
        ...metodo,
        tieneComision,
        comision: comisionCalculada.toFixed(2),
        montoBase: montoBase.toFixed(2),
        montoFinal: montoFinal.toFixed(2)
      };
    });
  };

  // Función para crear métodos de pago por defecto
  const crearMetodosPagoPorDefecto = (montoBase: number): MetodoPago[] => {
    return [
      {
        metodoPago: 'yape',
        nombreTitular: 'Ministerio Laico',
        numeroCelular: '999888777',
        esManual: true,
        tieneComision: false,
        comision: '0.00',
        montoBase: montoBase.toFixed(2),
        montoFinal: montoBase.toFixed(2),
        instrucciones: 'Realiza el pago por Yape y sube el comprobante en el siguiente paso'
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
        instrucciones: 'Realiza la transferencia y sube el comprobante en el siguiente paso'
      },
      {
        metodoPago: 'mercado_pago',
        esManual: false,
        tieneComision: true,
        comisionPorcentaje: '5.0',
        comisionFija: '0.00',
        comision: (montoBase * 0.05).toFixed(2), // 5% de comisión
        montoBase: montoBase.toFixed(2),
        montoFinal: (montoBase * 1.05).toFixed(2), // monto + 5%
        instrucciones: 'Pago con tarjeta de crédito/débito. Activación inmediata después del pago'
      },
      {
        metodoPago: 'stripe',
        esManual: false,
        tieneComision: true,
        comisionPorcentaje: '3.5',
        comisionFija: '1.00',
        comision: (montoBase * 0.035 + 1).toFixed(2), // 3.5% + $1
        montoBase: montoBase.toFixed(2),
        montoFinal: (montoBase * 1.035 + 1).toFixed(2), // monto + 3.5% + $1
        instrucciones: 'Pago internacional con tarjeta. Activación inmediata después del pago'
      }
    ];
  };

  const handlePagarTodo = async () => {
    if (!metodoPagoSeleccionado || inscripciones.length === 0 || metodosPago.length === 0) {
      setError('Información incompleta para procesar el pago');
      return;
    }

    setProcesandoPago(true);
    setError('');

    try {
      const metodoSeleccionado = metodosPago.find(m => m.metodoPago === metodoPagoSeleccionado);
      
      if (!metodoSeleccionado) {
        throw new Error('Método de pago no válido');
      }

      const inscripcionIds = inscripciones.map(i => i.id);

      if (metodoSeleccionado.esManual) {
        // Redirigir a página de envío de comprobante manual
        router.push(
          `/estudiante/pago-manual/cursos-multiples?inscripciones=${inscripcionIds.join(',')}&metodo=${metodoPagoSeleccionado}`
        );
      } else {
        // Iniciar pago con gateway
        const response = await apiClient.post('/pagos/gateway', {
          tipoPago: 'curso',
          idReferencia: inscripcionIds[0], // Primera inscripción como referencia
          monto: parseFloat(metodoSeleccionado.montoFinal),
          metodoPago: metodoPagoSeleccionado,
          descripcion: `Pago de ${inscripcionIds.length} cursos`,
          returnUrl: `${window.location.origin}/estudiante/pago-exitoso`,
          cancelUrl: `${window.location.origin}/estudiante/resumen-pagos`
        });

        if (response.data.success && response.data.data.checkoutUrl) {
          window.location.href = response.data.data.checkoutUrl;
        } else {
          setError('No se pudo iniciar el proceso de pago');
        }
      }
    } catch (err: any) {
      console.error('Error al procesar pago:', err);
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setProcesandoPago(false);
    }
  };

  const getMetodoPagoInfo = (metodo: MetodoPago) => {
    switch (metodo.metodoPago) {
      case 'mercado_pago':
      case 'stripe':
      case 'paypal':
        return {
          title: metodo.metodoPago === 'mercado_pago' ? 'Tarjeta (Mercado Pago)' : 
                 metodo.metodoPago === 'stripe' ? 'Tarjeta Internacional (Stripe)' : 'PayPal',
          subtitle: 'Pago automático, activación inmediata',
          icon: <CreditCard className="h-5 w-5" />,
          badge: 'Rápido'
        };
      case 'yape':
        return {
          title: 'Yape',
          subtitle: 'Pago manual, sin comisión',
          icon: <Banknote className="h-5 w-5" />,
          badge: 'Sin comisión'
        };
      case 'transferencia_bancaria':
        return {
          title: 'Transferencia Bancaria',
          subtitle: 'Pago manual, sin comisión',
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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const metodoActual = metodosPago.find(m => m.metodoPago === metodoPagoSeleccionado);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
          <p className="mt-4 text-gray-600">Cargando resumen de pagos...</p>
        </div>
      </div>
    );
  }

  if (!dataCargada && inscripciones.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No hay cursos pendientes de pago</CardTitle>
            <CardDescription>Todos tus cursos están al día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}
              <Button onClick={() => router.push('/estudiante/cursos')}>
                Ver Cursos Disponibles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Resumen de Pagos
            </CardTitle>
            <CardDescription>
              Revisa y completa el pago de tus cursos seleccionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Resumen general */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Cursos por Pagar</p>
                    <p className="text-3xl font-bold mt-2">{resumen.cantidad}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-3xl font-bold mt-2">${resumen.subtotal.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total con Descuento</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                      ${resumen.montoConDescuento.toFixed(2)}
                    </p>
                    {resumen.porcentajeDescuento > 0 && (
                      <Badge variant="outline" className="mt-2">
                        -{resumen.porcentajeDescuento}% descuento
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalle de cursos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Cursos Pendientes de Pago</h3>
              <div className="space-y-4">
                {inscripciones.map((inscripcion) => (
                  <Card key={inscripcion.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{inscripcion.curso.nombre}</h4>
                          <p className="text-sm text-gray-600">{inscripcion.curso.codigoCurso}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Inscrito el {formatearFecha(inscripcion.fechaInscripcion)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            ${Number(inscripcion.montoCurso).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            Pendiente
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Información sobre tipos de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-lg">Sin Comisión</p>
                      <p className="text-sm text-gray-500">Pago manual con comprobante</p>
                    </div>
                  </div>
                  <Badge className="mt-3 bg-green-100 text-green-800" variant="outline">
                    Ahorra en comisiones
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">
                    Debes enviar tu comprobante de pago
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="font-medium text-lg">Con Comisión</p>
                      <p className="text-sm text-gray-500">Pago automático instantáneo</p>
                    </div>
                  </div>
                  <Badge className="mt-3" variant="outline">
                    Activación inmediata
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">
                    Se aplica comisión del procesador
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Selección de método de pago */}
            <div className="mb-6">
              <Label className="text-lg font-medium mb-3 block">
                Selecciona tu método de pago:
              </Label>
              
              {metodosPago.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-yellow-700">
                      No hay métodos de pago disponibles. Por favor, contacta al administrador.
                    </p>
                  </div>
                </div>
              ) : (
                <RadioGroup value={metodoPagoSeleccionado} onValueChange={setMetodoPagoSeleccionado}>
                  {metodosPago.map((metodo) => {
                    const info = getMetodoPagoInfo(metodo);
                    const montoFinal = parseFloat(metodo.montoFinal);
                    const montoBase = parseFloat(metodo.montoBase);
                    const comision = parseFloat(metodo.comision);
                    
                    return (
                      <div key={metodo.metodoPago} className="space-y-3">
                        <div 
                          className={`flex items-start space-x-3 p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                            metodoPagoSeleccionado === metodo.metodoPago 
                              ? metodo.esManual 
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                                : 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setMetodoPagoSeleccionado(metodo.metodoPago)}
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
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs"
                                      >
                                        {info.badge}
                                      </Badge>
                                    )}
                                    {metodo.esManual ? (
                                      <Badge 
                                        className="bg-green-100 text-green-800"
                                        variant="outline"
                                      >
                                        Sin comisión
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">
                                        Con comisión
                                      </Badge>
                                    )}
                                  </div>
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                  {info.subtitle}
                                </p>
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
                        {metodoPagoSeleccionado === metodo.metodoPago && metodo.esManual && (
                          <div className="ml-8 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
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
                                {metodo.instrucciones && (
                                  <p className="mt-2 text-xs">
                                    <strong>Instrucciones:</strong> {metodo.instrucciones}
                                  </p>
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

            <Separator className="my-6" />

            {/* Resumen final */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Resumen del Pago</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({resumen.cantidad} cursos):</span>
                    <span>${resumen.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {resumen.porcentajeDescuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({resumen.porcentajeDescuento}%):</span>
                      <span>-${resumen.descuento.toFixed(2)}</span>
                    </div>
                  )}

                  {metodoActual && metodoActual.tieneComision && parseFloat(metodoActual.comision) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Comisión del procesador:</span>
                      <span>+${metodoActual.comision}</span>
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-purple-600">
                      ${metodoActual?.montoFinal || resumen.montoConDescuento.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/estudiante/cursos')}
                disabled={procesandoPago}
              >
                Agregar Más Cursos
              </Button>
              
              <Button
                className="flex-1"
                onClick={handlePagarTodo}
                disabled={procesandoPago || !metodoPagoSeleccionado || metodosPago.length === 0}
              >
                {procesandoPago ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {metodoActual?.esManual ? 'Continuar con Comprobante' : 'Pagar Ahora'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-500 space-y-1">
              {metodoActual?.esManual ? (
                <>
                  <p>• Realiza el pago por el método seleccionado</p>
                  <p>• Sube tu comprobante en la siguiente pantalla</p>
                  <p>• Tu pago será verificado en máximo 24 horas</p>
                </>
              ) : (
                <>
                  <p>• Serás redirigido a la pasarela de pago segura</p>
                  <p>• Tu curso se activará inmediatamente después del pago</p>
                  <p>• Recibirás confirmación por correo electrónico</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}