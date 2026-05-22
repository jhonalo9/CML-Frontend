// app/src/hooks/useVerificacionPago.ts
import { useState, useEffect } from 'react';
import apiClient from '@/app/src/lib/api/client';

interface EstadoVerificacion {
  estadoGeneral: 'sin_matricula' | 'pendiente' | 'completo';
  tieneMatriculaPagada: boolean;
  tieneCursosPendientes: boolean;
  cursosPendientes: Array<{
    id: number;
    nombre: string;
    estadoPago: string;
  }>;
  mensaje?: string;
}

export default function useVerificacionPago() {
  const [estado, setEstado] = useState<EstadoVerificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificarEstado = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar matrícula
      const matriculaRes = await apiClient.get('/matriculas/mi-matricula');
      const matricula = matriculaRes.data.data;

      console.log('🔍 [useVerificacionPago] Matrícula:', matricula);
      console.log('💳 [useVerificacionPago] Estado:', matricula.estadoPago);
      console.log('💰 [useVerificacionPago] Método:', matricula.metodoPago);

      // ⚠️ VERIFICACIÓN CLAVE: 
      // - Si estadoPago === 'pendiente' Y metodoPago !== null → En revisión
      // - Si estadoPago === 'pendiente' Y metodoPago === null → Debe pagar
      // - Si estadoPago === 'pagado' → Completado

      // Si no hay matrícula o no está pagada
      if (!matricula || matricula.estadoPago === 'pendiente' && !matricula.metodoPago) {
        console.log('❌ [useVerificacionPago] Sin matrícula pagada');
        setEstado({
          estadoGeneral: 'sin_matricula',
          tieneMatriculaPagada: false,
          tieneCursosPendientes: false,
          cursosPendientes: [],
          mensaje: 'Debes completar el pago de tu matrícula'
        });
        setLoading(false);
        return;
      }

      // Si matrícula está en revisión (tiene método de pago pero estado pendiente)
      if (matricula.estadoPago === 'pendiente' && matricula.metodoPago) {
        console.log('⏳ [useVerificacionPago] Matrícula en revisión');
        
        // Verificar si hay cursos también pendientes
        let cursosPendientes: any[] = [];
        try {
          const inscripcionesRes = await apiClient.get('/inscripciones/mis-inscripciones');
          const inscripciones = inscripcionesRes.data.data;
          
          cursosPendientes = inscripciones
            .filter((i: any) => i.estadoPago === 'pendiente' && i.metodoPago)
            .map((i: any) => ({
              id: i.id,
              nombre: i.curso?.nombre || 'Curso',
              estadoPago: i.estadoPago
            }));
        } catch (err) {
          console.log('No se pudieron cargar inscripciones');
        }

        setEstado({
          estadoGeneral: 'pendiente',
          tieneMatriculaPagada: false,
          tieneCursosPendientes: cursosPendientes.length > 0,
          cursosPendientes,
          mensaje: 'Tu pago está siendo verificado'
        });
        setLoading(false);
        return;
      }

      // Si matrícula está pagada, verificar cursos
      if (matricula.estadoPago === 'pagado') {
        console.log('✅ [useVerificacionPago] Matrícula pagada');
        
        try {
          const inscripcionesRes = await apiClient.get('/inscripciones/mis-inscripciones');
          const inscripciones = inscripcionesRes.data.data;

          const cursosPendientes = inscripciones
            .filter((i: any) => i.estadoPago === 'pendiente' && i.metodoPago)
            .map((i: any) => ({
              id: i.id,
              nombre: i.curso?.nombre || 'Curso',
              estadoPago: i.estadoPago
            }));

          if (cursosPendientes.length > 0) {
            console.log('⏳ [useVerificacionPago] Cursos pendientes de verificación');
            setEstado({
              estadoGeneral: 'pendiente',
              tieneMatriculaPagada: true,
              tieneCursosPendientes: true,
              cursosPendientes,
              mensaje: 'Tienes cursos pendientes de verificación'
            });
          } else {
            console.log('✅ [useVerificacionPago] Todo completo');
            setEstado({
              estadoGeneral: 'completo',
              tieneMatriculaPagada: true,
              tieneCursosPendientes: false,
              cursosPendientes: [],
              mensaje: 'Todos los pagos están verificados'
            });
          }
        } catch (err) {
          console.log('Error al cargar inscripciones, asumiendo completo');
          setEstado({
            estadoGeneral: 'completo',
            tieneMatriculaPagada: true,
            tieneCursosPendientes: false,
            cursosPendientes: [],
          });
        }
      }

    } catch (err: any) {
      console.error('💥 [useVerificacionPago] Error:', err);
      setError(err.response?.data?.message || 'Error al verificar estado');
      
      // Si hay error 404, no tiene matrícula
      if (err.response?.status === 404) {
        setEstado({
          estadoGeneral: 'sin_matricula',
          tieneMatriculaPagada: false,
          tieneCursosPendientes: false,
          cursosPendientes: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarEstado();
  }, []);

  return {
    estado,
    loading,
    error,
    refetch: verificarEstado
  };
}