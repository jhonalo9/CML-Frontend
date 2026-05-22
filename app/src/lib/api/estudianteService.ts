// app/src/lib/api/estudianteService.ts
import apiClient from './client';

export const estudianteService = {
  /**
   * Verificar estado completo del estudiante
   * Retorna el siguiente paso que debe seguir
   */
  verificarEstado: async (): Promise<{
    siguientePaso: 'matricularse' | 'pagar-matricula' | 'pago-en-revision' | 'inscribir-cursos' | 'dashboard';
    datos?: any;
    matricula?: any;
    cursos?: any[];
  }> => {
    try {
      // 1. Verificar si tiene matrícula
      const matriculaRes = await apiClient.get('/matriculas/mi-matricula');
      console.log('🔍 [estudianteService] Response matrícula:', matriculaRes.data);
      
      // 2. Verificar estado de pago de matrícula
      const matricula = matriculaRes.data.data;
      console.log('📋 [estudianteService] Matrícula objeto:', matricula);
      console.log('💳 [estudianteService] Estado pago:', matricula?.estadoPago);
      console.log('💰 [estudianteService] Método pago:', matricula?.metodoPago);
      
      // IMPORTANTE: Diferenciar entre los estados de pago
      if (matricula.estadoPago === 'pendiente') {
        console.log('⏳ [estudianteService] Estado: PENDIENTE');
        // Si tiene método de pago registrado, significa que ya pagó y está en revisión
        if (matricula.metodoPago) {
          console.log('✅ [estudianteService] Tiene método de pago -> PAGO EN REVISIÓN');
          return {
            siguientePaso: 'pago-en-revision',
            datos: { 
              matriculaId: matricula.id,
              tipo: 'matricula',
              referencia: matricula.codigoMatricula,
              monto: matricula.montoMatricula
            },
            matricula
          };
        } else {
          console.log('❌ [estudianteService] NO tiene método de pago -> DEBE PAGAR');
          // Si NO tiene método de pago, aún no ha pagado
          return {
            siguientePaso: 'pagar-matricula',
            datos: { matriculaId: matricula.id },
            matricula
          };
        }
      }
      
      // Si el estado es 'rechazado', debe volver a pagar
      if (matricula.estadoPago === 'rechazado') {
        console.log('❌ [estudianteService] Estado: RECHAZADO -> DEBE PAGAR');
        return {
          siguientePaso: 'pagar-matricula',
          datos: { 
            matriculaId: matricula.id,
            rechazado: true,
            motivoRechazo: matricula.motivoRechazo 
          },
          matricula
        };
      }

      // 3. Si la matrícula está pagada, verificar cursos inscritos
      const inscripcionesRes = await apiClient.get('/inscripciones/mis-inscripciones');
      const inscripciones = inscripcionesRes.data.data;
      
      // Separar cursos por estado
      const cursosPagados = inscripciones.filter(
        (inscripcion: any) => inscripcion.estadoPago === 'pagado'
      );
      
      const cursosPendientes = inscripciones.filter(
        (inscripcion: any) => inscripcion.estadoPago === 'pendiente' && inscripcion.metodoPago
      );

      // Si hay cursos pendientes de verificación, mostrar página de revisión
      if (cursosPendientes.length > 0) {
        return {
          siguientePaso: 'pago-en-revision',
          datos: { 
            tipo: 'cursos',
            cursosPendientes: cursosPendientes.map((c: any) => ({
              id: c.id,
              nombre: c.curso?.nombre || 'Curso',
              monto: c.montoPagado
            }))
          },
          matricula,
          cursos: inscripciones
        };
      }

      if (cursosPagados.length === 0) {
        // Obtener cursos disponibles
        const cursosRes = await apiClient.get('/inscripciones/disponibles');
        return {
          siguientePaso: 'inscribir-cursos',
          datos: { cursosDisponibles: cursosRes.data.data },
          matricula,
          cursos: inscripciones
        };
      }

      // Todo completo, puede ir al dashboard
      return {
        siguientePaso: 'dashboard',
        datos: { cursosPagados: cursosPagados.length },
        matricula,
        cursos: cursosPagados
      };

    } catch (error: any) {
      // Si no tiene matrícula (404), debe matricularse
      if (error.response?.status === 404) {
        return {
          siguientePaso: 'matricularse'
        };
      }
      
      // Otros errores
      throw error;
    }
  },

  /**
   * Verificar estado simplificado para middleware/protección de rutas
   */
  verificarAccesoDashboard: async (): Promise<boolean> => {
    try {
      const estado = await estudianteService.verificarEstado();
      return estado.siguientePaso === 'dashboard';
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtener datos necesarios para redirección
   */
  obtenerDatosRedireccion: async () => {
    const estado = await estudianteService.verificarEstado();
    
    let url = '/dashboard';
    let datos: any = {};

    switch (estado.siguientePaso) {
      case 'matricularse':
        url = '/estudiante/matricularse';
        break;
        
      case 'pagar-matricula':
        url = `/estudiante/pagar-matricula/${estado.datos?.matriculaId}`;
        datos = { 
          matricula: estado.matricula,
          rechazado: estado.datos?.rechazado,
          motivoRechazo: estado.datos?.motivoRechazo
        };
        break;
        
      case 'pago-en-revision':
        // Construir URL con parámetros según el tipo
        if (estado.datos?.tipo === 'matricula') {
          url = `/estudiante/pago-en-revision?tipo=matricula&referencia=${estado.datos.referencia}&monto=${estado.datos.monto}`;
        } else {
          url = `/estudiante/pago-en-revision?tipo=cursos`;
        }
        datos = estado.datos;
        break;
        
      case 'inscribir-cursos':
        url = '/estudiante/cursos';
        datos = { cursosDisponibles: estado.datos?.cursosDisponibles };
        break;
        
      case 'dashboard':
      default:
        url = '/dashboard';
        break;
    }

    return { url, datos, estado };
  }
};