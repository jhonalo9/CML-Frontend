import apiClient from './client';
import { LoginCredentials, RegisterData, AuthResponse, ApiResponse, Usuario } from "../../types";

export const authService = {
  // Registro
  async register(data: RegisterData): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.post('/auth/registro', data);
    return response.data;
  },

  // Login
   async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const data = response.data;
    
    if (data.success) {
      // Almacenar token en localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      localStorage.setItem('refreshToken', data.refreshToken || '');
      
      // Configurar header por defecto para futuras peticiones
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    }
    
    return data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
  },

   isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

   getToken(): string | null {
    return localStorage.getItem('token');
  },

   async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const data = response.data;
    
    if (data.success) {
      localStorage.setItem('token', data.accessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    }
    
    return data;
  },


  // Obtener perfil
  async getProfile(): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.get('/auth/perfil');
    return response.data;
  },

  // Actualizar perfil
  async updateProfile(data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.put('/auth/perfil', data);
    return response.data;
  },

  // Verificar email
  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/auth/verificar/${token}`);
    return response.data;
  },

  // Solicitar recuperación de contraseña
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/solicitar-recuperacion', { email });
    return response.data;
  },

  // Restablecer contraseña
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/auth/restablecer-password/${token}`, { password });
    return response.data;
  },
};