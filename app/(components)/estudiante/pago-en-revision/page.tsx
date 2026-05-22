// app/estudiante/pago-en-revision/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  RefreshCw,
  Home,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import useVerificacionPago from '@/app/src/hooks/useVerificacionPago';


export default function PagoEnRevisionPage() {
  const router = useRouter();
  const { estado, loading, error, refetch } = useVerificacionPago();
  const [tiempoActualizacion, setTiempoActualizacion] = useState(60); // 60 segundos
  const [actualizando, setActualizando] = useState(false);

  // Contador para actualización automática
  useEffect(() => {
    if (tiempoActualizacion > 0) {
      const timer = setTimeout(() => {
        setTiempoActualizacion(tiempoActualizacion - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Actualizar automáticamente cada minuto
      handleActualizarEstado();
      setTiempoActualizacion(60);
    }
  }, [tiempoActualizacion]);

  const handleActualizarEstado = async () => {
    setActualizando(true);
    await refetch();
    setActualizando(false);
  };

  const handleReintentarAcceso = async () => {
    await refetch();
    if (estado?.estadoGeneral === 'completo') {
      router.push('/dashboard');
    }
  };

  const handleVerMisPagos = () => {
    router.push('/estudiante/mis-pagos');
  };

  const handleContactarSoporte = () => {
    window.open('mailto:soporte@ministeriolaico.com?subject=Pago en revisión', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
              <div>
                <p className="font-medium text-gray-700">Verificando estado de pagos...</p>
                <p className="text-sm text-gray-500 mt-1">Cargando información de tu cuenta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !estado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              Error de conexión
            </CardTitle>
            <CardDescription className="text-center">
              No se pudo verificar el estado de tus pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Por favor, intenta nuevamente en unos momentos
            </p>
            <Button 
              className="w-full" 
              onClick={handleActualizarEstado}
              disabled={actualizando}
            >
              {actualizando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si todo está pagado, redirigir al dashboard
  if (estado.estadoGeneral === 'completo') {
    useEffect(() => {
      router.push('/dashboard');
    }, [router]);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button className="text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => router.push('/')}> salir</button>
        <div className="text-center mb-8">
        
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4 border-4 border-white shadow-lg">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {estado.estadoGeneral === 'sin_matricula' 
              ? 'Matrícula Pendiente de Pago' 
              : 'Pagos en Revisión'}
          </h1>
          <p className="text-lg text-gray-600">
            {estado.estadoGeneral === 'sin_matricula'
              ? 'Debes completar el pago de tu matrícula para acceder a la plataforma'
              : 'Tienes pagos pendientes de verificación'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estado de Pagos
              </CardTitle>
              <CardDescription>
                Resumen de los pagos pendientes de verificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Matrícula */}
              <div className={`p-4 rounded-lg border ${estado.tieneMatriculaPagada ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${estado.tieneMatriculaPagada ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {estado.tieneMatriculaPagada ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Matrícula</p>
                      <p className="text-sm text-gray-600">Acceso a plataforma</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={estado.tieneMatriculaPagada ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}
                  >
                    {estado.tieneMatriculaPagada ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              {/* Cursos pendientes */}
              {estado.tieneCursosPendientes && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Cursos Pendientes:</h3>
                  <div className="space-y-2">
                    {estado.cursosPendientes.map((curso) => (
                      <div key={curso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{curso.nombre}</span>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {curso.estadoPago === 'pendiente' ? 'Pendiente' : 'En revisión'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actualización automática */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw className="h-3 w-3" />
                  <span>Actualizando automáticamente en</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-1000"
                      style={{ width: `${(tiempoActualizacion / 60) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono">{tiempoActualizacion}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones e información */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>¿Qué necesitas hacer?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estado.estadoGeneral === 'sin_matricula' ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Pagar la matrícula</p>
                        <p className="text-sm text-gray-600">
                          Completa el pago de S/. 50.00 para activar tu cuenta
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Esperar verificación</p>
                        <p className="text-sm text-gray-600">
                          Nuestro equipo verificará tu comprobante (24-48h)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Acceder a plataforma</p>
                        <p className="text-sm text-gray-600">
                          Podrás ingresar al dashboard y seleccionar cursos
                        </p>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      onClick={() => router.push('/estudiante/pagar-matricula')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar Matrícula
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Espera la verificación</p>
                        <p className="text-sm text-gray-600">
                          Tu(s) pago(s) está(n) siendo revisado(s) por nuestro equipo administrativo
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Recibirás notificación</p>
                        <p className="text-sm text-gray-600">
                          Te notificaremos por email cuando el pago sea confirmado
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Acceso automático</p>
                        <p className="text-sm text-gray-600">
                          Los cursos se activarán automáticamente después de la confirmación
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleActualizarEstado}
                  disabled={actualizando}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {actualizando ? 'Actualizando...' : 'Actualizar Estado'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleVerMisPagos}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Mis Pagos
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleContactarSoporte}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Contactar Soporte
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleReintentarAcceso}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Reintentar Acceso
                </Button>
              </CardContent>
            </Card>

            {/* Información de contacto */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                Información importante
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Tiempo de verificación: 24-48 horas hábiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Horario de atención: Lunes a Viernes 9:00 - 18:00</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Email: soporte@ministeriolaico.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Teléfono: +51 999 888 777</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Esta página se cerrará automáticamente cuando tus pagos sean verificados
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="h-1 w-1 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
            <span>Monitoreando estado...</span>
          </div>
        </div>
      </div>
    </div>
  );
}