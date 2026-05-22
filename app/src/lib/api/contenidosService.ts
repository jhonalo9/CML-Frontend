import apiClient from './client';
import { ApiResponse } from "../../types";

interface Contenido {
  id: number;
  titulo: string;
  descripcion: string;
  tipoContenido: string;
  urlArchivo: string;
  duracionMinutos: number;
  orden: number;
}

export const contenidosService = {
  // Obtener contenidos de una unidad
  async getContenidosUnidad(unidadId: number): Promise<ApiResponse<Contenido[]>> {
    const response = await apiClient.get(`/contenidos/unidad/${unidadId}`);
    return response.data;
  },

  // Obtener un contenido específico
  async getContenido(id: number): Promise<ApiResponse<Contenido>> {
    const response = await apiClient.get(`/contenidos/${id}`);
    return response.data;
  },

  // Marcar contenido como completado
  async marcarCompletado(id: number, tiempoDedicadoMinutos?: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/contenidos/${id}/completar`, {
      tiempoDedicadoMinutos
    });
    return response.data;
  },

  // Obtener progreso de contenidos de un curso
  async getProgresoContenidos(cursoId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/contenidos/progreso/${cursoId}`);
    return response.data;
  }
};