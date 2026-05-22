import apiClient from './client';
import { Curso, ApiResponse, ClaseZoom } from "../../types";

export const cursosService = {
  // Listar cursos
  async getCursos(page = 1, limit = 12): Promise<ApiResponse<Curso[]>> {
    const response = await apiClient.get('/cursos', {
      params: { page, limit }
    });
    return response.data;
  },

  // Obtener curso por ID
  async getCurso(id: number): Promise<ApiResponse<Curso>> {
    const response = await apiClient.get(`/cursos/${id}`);
    return response.data;
  },

  // Obtener unidades de un curso
  async getUnidadesCurso(cursoId: number) {
    const response = await apiClient.get(`/cursos/${cursoId}/unidades`);
    return response.data;
  },

  // Obtener clases Zoom del curso
  async getClasesZoom(cursoId: number): Promise<ApiResponse<ClaseZoom[]>> {
    const response = await apiClient.get(`/cursos/${cursoId}/clases-zoom`);
    return response.data;
  },

  // Obtener próximas clases
  async getProximasClases(): Promise<ApiResponse<ClaseZoom[]>> {
    const response = await apiClient.get('/cursos/clases-zoom/proximas');
    return response.data;
  },
};