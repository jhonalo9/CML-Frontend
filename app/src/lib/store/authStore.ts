import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // ⬅️ NUEVO
  
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
  logout: () => void; // ⬅️ NUEVO (alias de clearAuth)
  checkAuth: () => boolean;
  setLoading: (loading: boolean) => void; // ⬅️ NUEVO
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // ⬅️ Iniciar en true para verificar auth al cargar
      
      setAuth: (user: any, token: string) => {
        // Sincronizar con localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false // ⬅️ Ya terminó de cargar
        });
        
        return true;
      },
      
      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false // ⬅️ Ya terminó de limpiar
        });
      },
      
      // ⬅️ NUEVO: Alias para logout (mismo comportamiento que clearAuth)
      logout: () => {
        get().clearAuth();
      },
      
      checkAuth: () => {
        set({ isLoading: true }); // ⬅️ Inicia loading
        
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              isLoading: false // ⬅️ Termina loading
            });
            return true;
          } catch (error) {
            console.error('Error parsing user:', error);
            get().clearAuth();
            return false;
          }
        } else {
          // Limpiar estado si no hay token
          if (get().isAuthenticated) {
            get().clearAuth();
          } else {
            set({ isLoading: false }); // ⬅️ Termina loading aunque no haya usuario
          }
          return false;
        }
      },
      
      // ⬅️ NUEVO: Helper para controlar loading manualmente
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // ⬅️ IMPORTANTE: No persistir isLoading
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // isLoading NO se persiste
      })
    }
  )
);