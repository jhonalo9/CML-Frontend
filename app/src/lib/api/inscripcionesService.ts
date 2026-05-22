import apiClient from './client';
import { InscripcionCurso, Curso, ApiResponse } from "../../types";

export const inscripcionesService = {
  // Inscribirse a un curso
  async inscribir(cursoId: number): Promise<ApiResponse<InscripcionCurso>> {
    const response = await apiClient.post('/inscripciones/inscribir', { cursoId });
    return response.data;
  },

  // Obtener mis inscripciones
  async getMisInscripciones(): Promise<ApiResponse<InscripcionCurso[]>> {
    const response = await apiClient.get('/inscripciones/mis-inscripciones');
    return response.data;
  },

  // Obtener cursos disponibles
  async getCursosDisponibles(): Promise<ApiResponse<Curso[]>> {
    const response = await apiClient.get('/inscripciones/disponibles');
    return response.data;
  },

  // Obtener progreso general
  async getProgresoGeneral(): Promise<ApiResponse> {
    const response = await apiClient.get('/inscripciones/progreso-general');
    return response.data;
  },

  // Confirmar pago de curso
  async confirmarPago(inscripcionId: number, data: any): Promise<ApiResponse> {
    const response = await apiClient.post(`/inscripciones/${inscripcionId}/confirmar-pago`, data);
    return response.data;
  },

  // Obtener detalle de inscripción
  async getDetalleInscripcion(id: number): Promise<ApiResponse<InscripcionCurso>> {
    const response = await apiClient.get(`/inscripciones/${id}`);
    return response.data;
  },
};