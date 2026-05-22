// src/services/api/admin.service.ts
import { ApiResponse, Usuario } from '../../types';
import apiClient from './client';

export const adminService = {
  // Listar usuarios
  async getUsuarios(): Promise<ApiResponse<Usuario[]>> {
    const response = await apiClient.get('/admin/usuarios');
    return response.data;
  },

  // Actualizar usuario
  async updateUsuario(id: number, data: Partial<Usuario>) {
    const response = await apiClient.put(`/admin/usuarios/${id}`, data);
    return response.data;
  },
};