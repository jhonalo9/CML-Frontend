// app/estudiante/pago-manual/exito/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  FileText,
  Clock,
  Mail,
  Phone,
  Home,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import Link from 'next/link';

interface PagoExitoData {
  cantidad: number;
  monto: number;
  referencia: string;
  fecha?: string;
  cursos?: string[];
}

export default function PagoManualExitoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pagoData, setPagoData] = useState<PagoExitoData | null>(null);
  const [contador, setContador] = useState(10);

  useEffect(() => {
    // Obtener datos de la URL
    const cantidad = searchParams.get('cantidad');
    const monto = searchParams.get('monto');
    const referencia = searchParams.get('referencia');

    if (cantidad && monto && referencia) {
      setPagoData({
        cantidad: parseInt(cantidad),
        monto: parseFloat(monto),
        referencia,
        fecha: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    } else {
      // Si no hay datos, redirigir al dashboard
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Contador para redirección automática
    if (contador > 0) {
      const timer = setTimeout(() => setContador(contador - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/dashboard');
    }
  }, [contador, router]);

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartir = async () => {
    if (navigator.share && pagoData) {
      try {
        await navigator.share({
          title: 'Comprobante de Pago - Ministerio Laico',
          text: `He registrado el pago de ${pagoData.cantidad} curso(s) por $${pagoData.monto.toFixed(2)}. Referencia: ${pagoData.referencia}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error compartiendo:', error);
      }
    } else {
      // Copiar al portapapeles como fallback
      const text = `Comprobante de Pago\n` +
        `Ministerio Laico\n` +
        `Referencia: ${pagoData?.referencia}\n` +
        `Cursos: ${pagoData?.cantidad}\n` +
        `Monto: $${pagoData?.monto.toFixed(2)}\n` +
        `Fecha: ${pagoData?.fecha}\n` +
        `Estado: Registrado - En verificación`;
      
      navigator.clipboard.writeText(text);
      alert('Comprobante copiado al portapapeles');
    }
  };

  if (!pagoData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con ícono de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Registrado Exitosamente!
          </h1>
          <p className="text-gray-600">
            Hemos recibido tu registro de pago para {pagoData.cantidad} curso(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Comprobante */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Comprobante de Pago
                </CardTitle>
                <CardDescription>
                  Guarda este comprobante como referencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Encabezado del comprobante */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold">Ministerio Laico</h2>
                        <p className="text-gray-600">Educación Teológica en Línea</p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        Referencia: {pagoData.referencia}
                      </Badge>
                    </div>
                  </div>

                  {/* Información del pago */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Fecha y Hora</p>
                        <p className="font-medium">{pagoData.fecha}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estado</p>
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Clock className="h-3 w-3 mr-1" />
                          En verificación
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Cantidad de Cursos</p>
                        <p className="font-medium text-lg">{pagoData.cantidad}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Monto Total</p>
                        <p className="font-bold text-2xl text-green-600">
                          ${pagoData.monto.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Instrucciones importantes */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Instrucciones Importantes
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Tu pago será verificado por nuestro equipo administrativo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Recibirás una notificación por email cuando el pago sea confirmado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>El acceso a los cursos se activará automáticamente después de la confirmación</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Tiempo estimado de verificación: 24-48 horas hábiles</span>
                      </li>
                    </ul>
                  </div>

                  {/* Pasos siguientes */}
                  <div>
                    <h3 className="font-semibold mb-3">¿Qué sigue?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-medium flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Verificación del pago</p>
                          <p className="text-sm text-gray-600">
                            Nuestro equipo verificará tu comprobante de pago
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-medium flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Notificación de confirmación</p>
                          <p className="text-sm text-gray-600">
                            Recibirás un email y una notificación en la plataforma
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-medium flex-shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Acceso a los cursos</p>
                          <p className="text-sm text-gray-600">
                            Podrás acceder a todos los cursos desde tu dashboard
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Acciones y contacto */}
          <div className="space-y-6">
            {/* Card de acciones */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleImprimir}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Imprimir Comprobante
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleCompartir}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir Comprobante
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/estudiante/mis-cursos')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Mis Cursos
                </Button>
                
                <Button 
                  className="w-full"
                  onClick={() => router.push('/dashboard')}
                >
                  Ir al Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Card de contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto y Soporte</CardTitle>
                <CardDescription>
                  ¿Necesitas ayuda con tu pago?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email de soporte</p>
                    <a 
                      href="mailto:admin@ministeriolaico.com" 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      admin@ministeriolaico.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-gray-600">+51 999 888 777</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Home className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Horario de atención</p>
                    <p className="text-sm text-gray-600">Lunes a Viernes: 9am - 6pm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de información adicional */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Información Adicional</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Conserva tu número de referencia: <strong>{pagoData.referencia}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Puedes consultar el estado de tu pago en "Mis Pagos"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Para consultas, menciona siempre tu número de referencia</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mensaje de redirección */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Serás redirigido automáticamente al dashboard en {contador} segundos
          </p>
          <Button 
            variant="link" 
            onClick={() => router.push('/dashboard')}
            className="mt-2"
          >
            Ir ahora
          </Button>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          nav, 
          footer, 
          button,
          .no-print {
            display: none !important;
          }
          
          body {
            padding: 20px;
          }
          
          .print-only {
            display: block !important;
          }
        }
        
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}