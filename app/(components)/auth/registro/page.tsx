'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/app/src/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingSpinner from '../../LoadingSpinner';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    sexo: 'Masculino' as 'Masculino' | 'Femenino',
    dni: '',
    edad: 0,
    fechaNacimiento: '',
    direccion: '',
    ciudad: '',
    pais: 'Perú',
    distritoPertenece: '',
    ocupacion: '',
    profesion: '',
    nivelEstudios: 'Secundaria' as 'Primaria' | 'Secundaria' | 'Superior',
    esMiembroPlenaComunion: false,
    nombreIglesia: '',
    nombrePastor: '',
    telefono: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
   
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.edad < 18) {
      setError('Debes ser mayor de 18 años para registrarte');
      return;
    }

    setLoading(true);
    setSubmitting(true);
    try {
      const response = await authService.register({
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        password: formData.password,
        sexo: formData.sexo,
        dni: formData.dni,
        edad: formData.edad,
        fechaNacimiento: formData.fechaNacimiento,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        pais: formData.pais,
        distritoPertenece: formData.distritoPertenece,
        ocupacion: formData.ocupacion,
        profesion: formData.profesion,
        nivelEstudios: formData.nivelEstudios,
        esMiembroPlenaComunion: formData.esMiembroPlenaComunion,
        nombreIglesia: formData.nombreIglesia,
        nombrePastor: formData.nombrePastor,
        telefono: formData.telefono
      });
      
      if (response.success) {
        setSuccess('¡Registro exitoso! Por favor verifica tu email para activar tu cuenta.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el registro. Por favor verifica tus datos.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-emerald-600 to-yellow-500 p-4">
        <LoadingSpinner 
          text="Creando tu cuenta..."
          size="xl"
          fullScreen={true}
          className="text-white"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-yellow-500 p-4 py-8 overflow-y-auto">
      <div className="flex justify-center">
        <Card className="w-full max-w-5xl shadow-2xl border-0 mb-8">
          <CardHeader className="space-y-3 text-center bg-white border-b-4 border-green-500 pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-yellow-400 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <span className="text-white text-3xl font-bold">ML</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Formulario de Registro
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Completa todos los campos para crear tu cuenta y comenzar
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 p-8">
            {error && (
              <Alert variant="destructive" className="border-2 border-red-400">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-2 border-green-400">
                <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
              </Alert>
            )}
            
            {/* Sección 1: Datos Personales */}
            <div className="space-y-5 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="nombres" className="text-gray-700 font-semibold">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => handleChange('nombres', e.target.value)}
                    required
                    className="bg-white  border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apellidos" className=" text-gray-700 font-semibold">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleChange('apellidos', e.target.value)}
                    required
                    className="bg-white border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-gray-700 font-semibold">DNI *</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleChange('dni', e.target.value)}
                    required
                    maxLength={8}
                    className="bg-white  border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sexo" className="text-gray-700 font-semibold">Sexo *</Label>
                  <Select value={formData.sexo} onValueChange={(value: 'Masculino' | 'Femenino') => handleChange('sexo', value)}>
                    <SelectTrigger className="bg-white border-2 border-green-200 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className="text-gray-700 font-semibold">Fecha de Nacimiento *</Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                    required
                    className="bg-white  border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edad" className="text-gray-700 font-semibold">Edad *</Label>
                  <Input
                    id="edad"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.edad}
                    onChange={(e) => handleChange('edad', parseInt(e.target.value))}
                    required
                    className="bg-white  border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Sección 2: Contacto */}
            <div className="space-y-5 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold text-yellow-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className="bg-white  border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-gray-700 font-semibold">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-gray-700 font-semibold">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ciudad" className="text-gray-700 font-semibold">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleChange('ciudad', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="distritoPertenece" className="text-gray-700 font-semibold">Distrito *</Label>
                  <Input
                    id="distritoPertenece"
                    value={formData.distritoPertenece}
                    onChange={(e) => handleChange('distritoPertenece', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pais" className="text-gray-700 font-semibold">País *</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) => handleChange('pais', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Sección 3: Información Profesional */}
            <div className="space-y-5 bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border-l-4 border-emerald-500">
              <h3 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Información Profesional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="ocupacion" className="text-gray-700 font-semibold">Ocupación</Label>
                  <Input
                    id="ocupacion"
                    value={formData.ocupacion}
                    onChange={(e) => handleChange('ocupacion', e.target.value)}
                    className="bg-white border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profesion" className="text-gray-700 font-semibold">Profesión</Label>
                  <Input
                    id="profesion"
                    value={formData.profesion}
                    onChange={(e) => handleChange('profesion', e.target.value)}
                    className="bg-white border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nivelEstudios" className="text-gray-700 font-semibold">Nivel de Estudios *</Label>
                  <Select value={formData.nivelEstudios} onValueChange={(value: 'Primaria' | 'Secundaria' | 'Superior') => handleChange('nivelEstudios', value)}>
                    <SelectTrigger className="bg-white border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primaria">Primaria</SelectItem>
                      <SelectItem value="Secundaria">Secundaria</SelectItem>
                      <SelectItem value="Superior">Superior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Sección 4: Información Espiritual */}
            <div className="space-y-5 bg-gradient-to-r from-green-50 to-yellow-50 p-6 rounded-xl border-l-4 border-green-600">
              <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                Información Espiritual
              </h3>
              
              <div className="space-y-5">
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border-2 border-green-200">
                  <Checkbox 
                    id="esMiembroPlenaComunion" 
                    checked={formData.esMiembroPlenaComunion}
                    onCheckedChange={(checked) => handleChange('esMiembroPlenaComunion', checked)}
                    className="border-green-500 data-[state=checked]:bg-green-500"
                  />
                  <Label htmlFor="esMiembroPlenaComunion" className="cursor-pointer font-medium text-gray-700">
                    Soy miembro en plena comunión de una iglesia evangélica
                  </Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="nombreIglesia" className="text-gray-700 font-semibold">Nombre de la Iglesia *</Label>
                    <Input
                      id="nombreIglesia"
                      value={formData.nombreIglesia}
                      onChange={(e) => handleChange('nombreIglesia', e.target.value)}
                      required
                      className="bg-white border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombrePastor" className="text-gray-700 font-semibold">Nombre del Pastor *</Label>
                    <Input
                      id="nombrePastor"
                      value={formData.nombrePastor}
                      onChange={(e) => handleChange('nombrePastor', e.target.value)}
                      required
                      className="bg-white border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección 5: Credenciales */}
            <div className="space-y-5 bg-gradient-to-r from-yellow-50 to-green-50 p-6 rounded-xl border-l-4 border-yellow-600">
              <h3 className="text-xl font-bold text-yellow-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
                Credenciales de Acceso
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    className="bg-white border-2 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-5 bg-white border-t-4 border-green-500 pt-6 px-8 pb-6">
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg w-full">
              <p className="font-semibold text-green-700">* Campos obligatorios</p>
              <p className="mt-2">Al registrarte, aceptas nuestros términos y condiciones de uso.</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-yellow-500 hover:from-green-700 hover:via-emerald-700 hover:to-yellow-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              disabled={loading}
              size="lg"
            >
              {loading ? 'Creando cuenta...' : '🚀 Registrarme Ahora'}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 hover:underline font-bold">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}