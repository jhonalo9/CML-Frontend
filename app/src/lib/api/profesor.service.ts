// services/profesor.service.ts
import apiClient from './client';
// ==================== CURSOS ====================
export const cursosService = {
  // Obtener todos los cursos
  listarCursos: async (params?: { page?: number; limit?: number; esCurricular?: boolean }) => {
    const response = await apiClient.get('/cursos', { params });
    return response.data;
  },

  // Obtener curso por ID
  obtenerCurso: async (id: number) => {
    const response = await apiClient.get(`/cursos/${id}`);
    return response.data;
  },

  // Obtener unidades de un curso
  obtenerUnidadesCurso: async (cursoId: number) => {
    const response = await apiClient.get(`/cursos/${cursoId}/unidades`);
    return response.data;
  },

  obtenerMisCursosProfesor: async () => {
    const response = await apiClient.get('/cursos/profesor/mis-cursos');
    return response.data;
  },
obtenerEstadisticasProfesor: async () => {
    const response = await apiClient.get('/cursos/profesor/estadisticas');
    return response.data;
  },

  // Actualizar unidad
  actualizarUnidad: async (id: number, data: { titulo?: string; descripcion?: string; objetivos?: string }) => {
    const response = await apiClient.put(`/cursos/unidades/${id}`, data);
    return response.data;
  },

  // Crear unidad adicional
  crearUnidad: async (data: {
    cursoId: number;
    numeroUnidad: number;
    titulo: string;
    descripcion?: string;
    objetivos?: string;
    orden: number;
  }) => {
    const response = await apiClient.post('/cursos/unidades', data);
    return response.data;
  },
};

// ==================== EVALUACIONES ====================
export const evaluacionesService = {
  // Crear evaluación
  crearEvaluacion: async (data: {
    cursoId: number;
    unidadId?: number;
    numeroEvaluacion: number;
    titulo: string;
    descripcion?: string;
    tipo: 'evaluacion_unidad' | 'examen_final';
    puntuacionMaxima?: number;
    puntuacionMinimaAprobacion?: number;
    duracionMinutos?: number;
    intentosPermitidos?: number;
    fechaDisponible?: string;
    fechaCierre?: string;
    instrucciones?: string;
  }) => {
    const response = await apiClient.post('/evaluaciones', data);
    return response.data;
  },

  // Agregar pregunta a evaluación
  agregarPregunta: async (data: {
    evaluacionId: number;
    pregunta: string;
    tipoPregunta: 'multiple_choice' | 'verdadero_falso' | 'desarrollo' | 'completar';
    opciones?: any;
    respuestaCorrecta?: string;
    puntos: number;
    orden: number;
    retroalimentacion?: string;
  }) => {
    const response = await apiClient.post('/evaluaciones/preguntas', data);
    return response.data;
  },

  // Obtener evaluaciones de un curso
  obtenerEvaluacionesCurso: async (cursoId: number) => {
    const response = await apiClient.get(`/evaluaciones/curso/${cursoId}`);
    return response.data;
  },

  // Obtener evaluación con preguntas
  obtenerEvaluacion: async (id: number) => {
    const response = await apiClient.get(`/evaluaciones/${id}`);
    return response.data;
  },

  // Listar evaluaciones pendientes de calificar
  listarEvaluacionesPendientes: async (cursoId?: number) => {
    const params = cursoId ? { cursoId } : {};
    const response = await apiClient.get('/evaluaciones/pendientes', { params });
    return response.data;
  },

  // Calificar evaluación
  calificarEvaluacion: async (id: number, data: {
    puntuacionObtenida: number;
    retroalimentacion?: string;
  }) => {
    const response = await apiClient.post(`/evaluaciones/calificar/${id}`, data);
    return response.data;
  },

  // Obtener resultado de evaluación
  obtenerResultado: async (id: number) => {
    const response = await apiClient.get(`/evaluaciones/resultado/${id}`);
    return response.data;
  },

  // Obtener historial de evaluaciones (para profesor)
  obtenerHistorialEvaluaciones: async (cursoId?: number) => {
    const params = cursoId ? { cursoId } : {};
    const response = await apiClient.get('/evaluaciones/historial/mis-evaluaciones', { params });
    return response.data;
  },

  // Obtener notas de estudiante en un curso
  obtenerNotasEstudiante: async (cursoId: number) => {
    const response = await apiClient.get(`/evaluaciones/notas/curso/${cursoId}`);
    return response.data;
  },
};

// ==================== CONTENIDOS ====================
export const contenidosService = {
  // Subir contenido
  subirContenido: async (formData: FormData) => {
    const response = await apiClient.post('/contenidos/subir', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obtener contenidos de una unidad
  obtenerContenidosUnidad: async (unidadId: number) => {
    const response = await apiClient.get(`/contenidos/unidad/${unidadId}`);
    return response.data;
  },

  // Obtener un contenido específico
  obtenerContenido: async (id: number) => {
    const response = await apiClient.get(`/contenidos/${id}`);
    return response.data;
  },

  // Actualizar contenido
  actualizarContenido: async (id: number, data: {
    titulo?: string;
    descripcion?: string;
    orden?: number;
    duracionMinutos?: number;
  }) => {
    const response = await apiClient.put(`/contenidos/${id}`, data);
    return response.data;
  },

  // Eliminar contenido
  eliminarContenido: async (id: number) => {
    const response = await apiClient.delete(`/contenidos/${id}`);
    return response.data;
  },

  // Obtener progreso de contenidos de un curso
  obtenerProgresoContenidos: async (cursoId: number) => {
    const response = await apiClient.get(`/contenidos/progreso/${cursoId}`);
    return response.data;
  },
};

// ==================== CLASES ZOOM ====================
export const clasesZoomService = {
  // Programar clase Zoom
  programarClaseZoom: async (data: {
    cursoId: number;
    unidadId?: number;
    titulo: string;
    descripcion?: string;
    fechaHoraInicio: string;
    fechaHoraFin: string;
    urlZoom: string;
    meetingId?: string;
    passwordZoom?: string;
  }) => {
    const response = await apiClient.post('/cursos/clases-zoom', data);
    return response.data;
  },

  // Listar clases Zoom de un curso
  listarClasesZoom: async (cursoId: number, estado?: string) => {
    const params = estado ? { estado } : {};
    const response = await apiClient.get(`/cursos/${cursoId}/clases-zoom`, { params });
    return response.data;
  },

  // Obtener próximas clases (todas los cursos del profesor)
  obtenerProximasClases: async () => {
    const response = await apiClient.get('/cursos/clases-zoom/proximas');
    return response.data;
  },

  // Actualizar clase Zoom
  actualizarClaseZoom: async (id: number, data: {
    estado?: 'programada' | 'completada' | 'cancelada';
    urlGrabacion?: string;
  }) => {
    const response = await apiClient.put(`/cursos/clases-zoom/${id}`, data);
    return response.data;
  },
};

// ==================== DASHBOARD STATS ====================
export const dashboardService = {
  // Obtener estadísticas generales del profesor
  obtenerEstadisticas: async () => {
    try {
      // Obtener cursos
      const cursosResponse = await cursosService.listarCursos();
      const cursos = cursosResponse.data?.data || [];

      // Obtener evaluaciones pendientes
      const pendientesResponse = await evaluacionesService.listarEvaluacionesPendientes();
      const pendientes = pendientesResponse.data || [];

      // Obtener próximas clases
      const clasesResponse = await clasesZoomService.obtenerProximasClases();
      const clases = clasesResponse.data || [];

      // Calcular total de estudiantes (sumar de todos los cursos)
      const totalEstudiantes = cursos.reduce((sum: number, curso: any) => {
        return sum + (curso._count?.inscripciones || 0);
      }, 0);

      return {
        totalCursos: cursos.length,
        estudiantesActivos: totalEstudiantes,
        evaluacionesPendientes: pendientes.length,
        proximasClases: clases.length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalCursos: 0,
        estudiantesActivos: 0,
        evaluacionesPendientes: 0,
        proximasClases: 0,
      };
    }
  },
};

// ==================== HELPER PARA SUBIR ARCHIVOS ====================
export const uploadHelper = {
  // Crear FormData para subir contenido
  crearFormDataContenido: (data: {
    file: File;
    unidadId: number;
    titulo: string;
    descripcion?: string;
    tipoContenido: 'pdf' | 'video_zoom' | 'diapositiva' | 'otro';
    orden: number;
    duracionMinutos?: number;
  }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('unidadId', data.unidadId.toString());
    formData.append('titulo', data.titulo);
    formData.append('tipoContenido', data.tipoContenido);
    formData.append('orden', data.orden.toString());
    
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }
    
    if (data.duracionMinutos) {
      formData.append('duracionMinutos', data.duracionMinutos.toString());
    }

    return formData;
  },
};

// Exportar todo como un objeto
export const profesorAPI = {
  cursos: cursosService,
  evaluaciones: evaluacionesService,
  contenidos: contenidosService,
  clasesZoom: clasesZoomService,
  dashboard: dashboardService,
  upload: uploadHelper,
};

export default profesorAPI;