import apiClient from './client';
import { ApiResponse } from "../../types";

interface Evaluacion {
  id: number;
  cursoId: number;
  unidadId?: number;
  numeroEvaluacion: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  puntuacionMaxima: number;
  duracionMinutos: number;
  intentosPermitidos: number;
  activa: boolean;
}

export const evaluacionesService = {
  // Obtener evaluaciones de un curso
  async getEvaluacionesCurso(cursoId: number): Promise<ApiResponse<Evaluacion[]>> {
    const response = await apiClient.get(`/evaluaciones/curso/${cursoId}`);
    return response.data;
  },

  // Obtener evaluación específica
  async getEvaluacion(id: number): Promise<ApiResponse<Evaluacion>> {
    const response = await apiClient.get(`/evaluaciones/${id}`);
    return response.data;
  },

  // Enviar respuestas
  async enviarRespuestas(evaluacionId: number, respuestas: any, tiempoEmpleadoMinutos?: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/evaluaciones/${evaluacionId}/enviar`, {
      respuestas,
      tiempoEmpleadoMinutos
    });
    return response.data;
  },

  // Obtener resultado
  async getResultado(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/evaluaciones/resultado/${id}`);
    return response.data;
  },

  // Obtener historial
  async getHistorial(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/evaluaciones/historial/mis-evaluaciones');
    return response.data;
  },


  async getNotasCurso(cursoId: number): Promise<ApiResponse<any>> {
  const response = await apiClient.get(`/evaluaciones/notas/curso/${cursoId}`);
  return response.data;
}
};