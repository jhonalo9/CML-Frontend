'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/src/lib/store/authStore';
import { inscripcionesService } from '@/app/src/lib/api/inscripcionesService';
import { cursosService } from '@/app/src//lib/api/cursosService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Clock, Award, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [proximasClases, setProximasClases] = useState<any[]>([]);
  const [progreso, setProgreso] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    try {
      const [inscripcionesRes, clasesRes, progresoRes] = await Promise.all([
        inscripcionesService.getMisInscripciones(),
        cursosService.getProximasClases(),
        inscripcionesService.getProgresoGeneral()
      ]);

      if (inscripcionesRes.success) {
        setInscripciones(inscripcionesRes.data || []);
      }
      if (clasesRes.success) {
        setProximasClases(clasesRes.data || []);
      }
      if (progresoRes.success) {
        setProgreso(progresoRes.data);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-yellow-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            {/* Logo y Bienvenida */}
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-15 w-15 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold">
                  ¡Bienvenido, {user?.nombres}!
                </h1>
                <p className="mt-2 text-white/90">
                  Continúa tu camino de formación espiritual
                </p>
              </div>
            </div>
            
            {/* Botón Cerrar Sesión */}
            <Button 
              variant="outline" 
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/auth/login');
              }}
              className="bg-black/10 border-red/20 text-white hover:bg-red-600/50 hover:text-white"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cursos Activos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progreso?.cursosEnProgreso || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                de {progreso?.cursosInscritos || 0} inscritos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completados
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progreso?.cursosCompletados || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                de 12 requeridos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Progreso General
              </CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progreso?.progresoGeneral || 0}%</div>
              <Progress value={progreso?.progresoGeneral || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Próximas Clases
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proximasClases.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                esta semana
              </p>
            </CardContent>
          </Card>
        </div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Cursos en Progreso */}
  <div className="lg:col-span-2 space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Mis Cursos</h2>
      <Link href="/estudiante/cursos">
        <Button variant="outline">+ Agregar</Button>
      </Link>
    </div>
    
    {/* Grid para las tarjetas de cursos */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {inscripciones.length === 0 ? (
        <div className="md:col-span-2">
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes cursos inscritos</h3>
              <p className="text-gray-500 mb-4">
                Explora nuestro catálogo y comienza tu formación
              </p>
              <Link href="/cursos">
                <Button>Explorar Cursos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        inscripciones.map((inscripcion) => (
          <Link 
            key={inscripcion.id} 
            href={`/cursos/${inscripcion.cursoId}`}
            className="cursor-pointer"
          >
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden rounded-ms hover:scale-[1.02]">
              {/* Portada del curso */}
              <div className="relative h-58 bg-gradient-to-br from-yellow-300 to-yellow-400 overflow-hidden">
                {inscripcion.curso.imagenPortada ? (
                  <img 
                    src={inscripcion.curso.imagenPortada} 
                    alt={inscripcion.curso.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white/30" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={inscripcion.estadoCurso === 'en_progreso' ? 'default' : 'secondary'}
                    className="shadow-lg"
                  >
                    {inscripcion.estadoCurso === 'en_progreso' ? 'En Progreso' : 
                     inscripcion.estadoCurso === 'completado' ? 'Completado' :
                     inscripcion.estadoCurso === 'no_iniciado' ? 'No Iniciado' : 
                     inscripcion.estadoCurso}
                  </Badge>
                </div>
              </div>
              <div>
                    
                    <Progress value={inscripcion.progresoPorcentaje} />
                    <div className="flex justify-between text-sm h-1 mt-1 mb-1 px-1 ">
                     
                      <span className="font-medium">{inscripcion.progresoPorcentaje}%</span>
                    </div>
                    
                  </div>
              
              <CardHeader>
                
                <CardTitle className="text-lg">{inscripcion.curso.nombre}</CardTitle>
                {/*<CardDescription className="text-xs">
                  Código: {inscripcion.curso.codigoCurso}
                </CardDescription>*/}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  
                  
                  {/* Información del profesor */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {inscripcion.curso.profesores?.[0]?.profesor?.fotoPerfil ? (
                        <img 
                          src={inscripcion.curso.profesores[0].profesor.fotoPerfil} 
                          alt={inscripcion.curso.profesores[0].profesor.nombres}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {inscripcion.curso.profesores?.[0]?.profesor?.nombres?.charAt(0) || 'P'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 truncate">
                      {inscripcion.curso.profesores?.[0]?.profesor 
                        ? `${inscripcion.curso.profesores[0].profesor.nombres} ${inscripcion.curso.profesores[0].profesor.apellidos}`
                        : 'Profesor asignado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  </div>
  
  {/* Próximas Clases */}
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Próximas Clases</h2>
    
    {proximasClases.length === 0 ? (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No hay clases programadas
          </p>
        </CardContent>
      </Card>
    ) : (
      proximasClases.map((clase) => (
        <Card key={clase.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{clase.titulo}</CardTitle>
            <CardDescription className="text-xs">
              {clase.curso.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(clase.fechaHoraInicio).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {new Date(clase.fechaHoraInicio).toLocaleTimeString()}
              </div>
              <Button size="sm" className="w-full mt-2" asChild>
                <a href={clase.urlZoom} target="_blank" rel="noopener noreferrer">
                  Unirse a la Clase
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>
</div>
      </div>
    </div>
  );
}