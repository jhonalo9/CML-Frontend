'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { authService } from '@/app/src/lib/api/authService';
import { estudianteService } from '@/app/src/lib/api/estudianteService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/app/src/lib/store/authStore';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, checkAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const isAuthenticated = checkAuth();
    if (isAuthenticated) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.tipoUsuario === 'administrador') {
          router.push('/admin');
        }
      }
    }
  }, [checkAuth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      
      if (response.success) {
        // Guardar autenticación
        setAuth(response.data.usuario, response.data.accessToken);
        
        // Redirigir según el tipo de usuario
        if (response.data.usuario.tipoUsuario === 'administrador') {
          router.push('/admin');
        } else if (response.data.usuario.tipoUsuario === 'profesor') {
          router.push('/profesor');
        } else {
          // Para estudiantes, verificar su estado completo
          setRedirecting(true);
          
          try {
            const redireccion = await estudianteService.obtenerDatosRedireccion();
            
            // Log para debugging
            console.log('Redirección determinada:', redireccion);
            
            // Redirigir a la URL correcta
            router.push(redireccion.url);
          } catch (redirectError) {
            console.error('Error en redirección:', redirectError);
            // Si falla la verificación, ir al dashboard por defecto
            router.push('/dashboard');
          }
        }
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos. Espera unos segundos.');
      } else if (err.response?.status === 401) {
        setError('Credenciales inválidas');
      } else if (err.response?.status === 403) {
        if (err.response?.data?.message?.includes('Email no verificado')) {
          setError('Email no verificado. Por favor verifica tu cuenta.');
        } else {
          setError(err.response?.data?.message || 'Usuario inactivo o suspendido');
        }
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-700 to-green-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              CML
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Ministerio Laico</CardTitle>
          <CardDescription>Ingresa a tu cuenta para continuar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {redirecting && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Verificando tu cuenta...</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading || redirecting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading || redirecting}
              />
            </div>

            <div className="flex justify-end">
              <Link 
                href="/auth/recuperar-password" 
                className="text-sm text-green-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              disabled={loading || redirecting}
            >
              {loading || redirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {redirecting ? 'Verificando cuenta...' : 'Iniciando sesión...'}
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/registro" className="text-green-800 hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}