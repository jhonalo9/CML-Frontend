'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/src/lib/store/authStore';
import { cursosService } from '@/app/src/lib/api/cursosService';
import { contenidosService } from '@/app/src/lib/api/contenidosService';
import { evaluacionesService } from '@/app/src/lib/api/evaluacionesService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen, FileText, FileQuestion, Award, Video,
  Download, PlayCircle, CheckCircle, Calendar,
  ChevronRight, Clock, BarChart3, Users, FileArchive
} from 'lucide-react';
import Link from 'next/link';
import { NotasResponse } from '@/app/src/types';

export default function CursoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const cursoId = parseInt(params.cursoId as string);
  
  const [curso, setCurso] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [contenidos, setContenidos] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [clasesZoom, setClasesZoom] = useState<any[]>([]);
  const [notas, setNotas] = useState<NotasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contenido');
  const [unidadesExpandidas, setUnidadesExpandidas] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadCursoData();
  }, [cursoId, isAuthenticated]);

  const loadCursoData = async () => {
  try {
    setLoading(true);
    
    // Obtener curso
    const cursoRes = await cursosService.getCurso(cursoId);
    if (cursoRes.success) {
      setCurso(cursoRes.data);
    }

    // Obtener unidades
    const unidadesRes = await cursosService.getUnidadesCurso(cursoId);
    if (unidadesRes.success) {
      setUnidades(unidadesRes.data || []);
    }

    // Obtener evaluaciones
    const evalRes = await evaluacionesService.getEvaluacionesCurso(cursoId);
    if (evalRes.success) {
      setEvaluaciones(evalRes.data || []);
    }

    // Obtener notas del curso
    const notasRes = await evaluacionesService.getNotasCurso(cursoId);
    if (notasRes.success) {
      setNotas(notasRes.data);
    }

    // Obtener clases Zoom
    const zoomRes = await cursosService.getClasesZoom(cursoId);
    if (zoomRes.success) {
      setClasesZoom(zoomRes.data || []);
    }

  } catch (error) {
    console.error('Error cargando datos del curso:', error);
  } finally {
    setLoading(false);
  }
};

  const loadContenidosUnidad = async (unidadId: number) => {
    try {
      const res = await contenidosService.getContenidosUnidad(unidadId);
      if (res.success) {
        setContenidos(prev => ({
          ...prev,
          [unidadId]: res.data
        }));
      }
    } catch (error) {
      console.error('Error cargando contenidos:', error);
    }
  };

  const toggleUnidad = async (unidadId: number) => {
    if (unidadesExpandidas.includes(unidadId)) {
      setUnidadesExpandidas(prev => prev.filter(id => id !== unidadId));
    } else {
      setUnidadesExpandidas(prev => [...prev, unidadId]);
      if (!contenidos[unidadId]) {
        await loadContenidosUnidad(unidadId);
      }
    }
  };

  const getIconoTipoContenido = (tipo: string) => {
    switch (tipo) {
      case 'video':
      case 'video_zoom': return <PlayCircle className="h-4 w-4 text-red-500" />;
      case 'pdf': return <FileText className="h-4 w-4 text-red-600" />;
      case 'diapositiva': return <FileArchive className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Curso no encontrado</h2>
            <Link href="/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Curso */}
      <div className="bg-gradient-to-r from-green-600 to-yellow-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8 py-4">
          <div className="mb-5">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/20 ">
                ← Volver al Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{curso.nombre}</h1>
              <p className="mt-2 text-purple-100">{curso.descripcion}</p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-purple-500">
                  Código: {curso.codigoCurso}
                </Badge>
                <Badge variant="outline" className="text-white border-white">
                  {curso.duracionSemanas} semanas
                </Badge>
                <Badge variant="outline" className="text-white border-white">
                  {unidades.length} unidades
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas Principales */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="silabo">Silabo</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
            <TabsTrigger value="zoom">Zoom</TabsTrigger>
          </TabsList>

          {/* Pestaña: SILABO */}
          <TabsContent value="silabo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentación del Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Descripción General</h3>
                  <p className="text-gray-600">{curso.descripcion}</p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Objetivos del Curso</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    {curso.objetivos ? (
                      curso.objetivos.split('\n').map((obj: string, idx: number) => (
                        <li key={idx}>{obj}</li>
                      ))
                    ) : (
                      <li>Objetivos no especificados</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Información del Curso</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="font-medium">{curso.codigoCurso}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duración</p>
                      <p className="font-medium">{curso.duracionSemanas} semanas</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Precio</p>
                      <p className="font-medium">S/ {curso.precio}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium">{curso.esCurricular ? 'Curricular' : 'Electivo'}</p>
                    </div>
                  </div>
                </div>

                {curso.silaboUrl && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Documentos</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-medium">Sílabo del Curso</p>
                          <p className="text-sm text-gray-500">Documento oficial</p>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <a href={curso.silaboUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: CONTENIDO */}
          <TabsContent value="contenido" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Unidades del Curso</h2>
              <Badge variant="outline">
                {unidades.length} unidades
              </Badge>
            </div>

            {unidades.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Este curso aún no tiene unidades publicadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unidades.sort((a, b) => a.orden - b.orden).map((unidad) => (
                  <Card key={unidad.id} className="overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleUnidad(unidad.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-2xl text-purple-600">
                              {unidad.numeroUnidad}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{unidad.titulo}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {unidad.descripcion || 'Sin descripción'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-transform ${
                          unidadesExpandidas.includes(unidad.id) ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Contenidos Expandidos */}
                    {unidadesExpandidas.includes(unidad.id) && (
                      <div className="border-t bg-gray-50">
                        <div className="p-6">
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="font-bold">Contenido de la Unidad</h4>
                            <Badge variant="secondary">
                              {contenidos[unidad.id]?.length || 0} recursos
                            </Badge>
                          </div>
                          
                          {contenidos[unidad.id] ? (
                            <div className="space-y-3">
                              {contenidos[unidad.id].map((contenido: any) => (
                                <div key={contenido.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {getIconoTipoContenido(contenido.tipoContenido)}
                                    <div>
                                      <p className="font-medium">{contenido.titulo}</p>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="capitalize">{contenido.tipoContenido}</span>
                                        {contenido.duracionMinutos > 0 && (
                                          <>
                                            <span>•</span>
                                            <Clock className="h-3 w-3" />
                                            <span>{contenido.duracionMinutos} min</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={contenido.urlArchivo} target="_blank" rel="noopener noreferrer">
                                        <PlayCircle className="h-4 w-4 mr-1" />
                                        Ver
                                      </a>
                                    </Button>
                                    <Button size="sm">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Completar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-gray-500">Cargando contenido...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pestaña: EVALUACIONES */}
          <TabsContent value="evaluaciones" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Evaluaciones Activas */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5" />
                    Evaluaciones del Curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evaluaciones.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No hay evaluaciones programadas
                      </p>
                    ) : (
                      evaluaciones.map((evalItem) => (
                        <div key={evalItem.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-lg">{evalItem.titulo}</h4>
                              <p className="text-sm text-gray-500">{evalItem.descripcion}</p>
                            </div>
                            <Badge variant={
                              evalItem.tipo === 'examen_final' ? 'destructive' : 'secondary'
                            }>
                              {evalItem.tipo === 'examen_final' ? 'Examen Final' : 'Unidad'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Puntuación</p>
                              <p className="font-medium">{evalItem.puntuacionMaxima} pts</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Duración</p>
                              <p className="font-medium">{evalItem.duracionMinutos} min</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Intentos</p>
                              <p className="font-medium">{evalItem.intentosPermitidos}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Estado</p>
                              <Badge variant={evalItem.activa ? 'default' : 'outline'}>
                                {evalItem.activa ? 'Disponible' : 'Cerrada'}
                              </Badge>
                            </div>
                          </div>

                          <Button className="w-full">
                            {evalItem.activa ? 'Comenzar Evaluación' : 'Ver Resultados'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-500">Promedio General</p>
                    <p className="text-3xl font-bold text-purple-600">17.5</p>
                    <p className="text-sm text-gray-500">/20.0</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Evaluaciones Realizadas</span>
                        <span>2/4</span>
                      </div>
                      <Progress value={50} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Aprobación</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="bg-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        
            <TabsContent value="notas" className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Historial de Calificaciones
                </CardTitle>
                <CardDescription>
                    {notas?.estadisticas?.evaluacionesRealizadas || 0} de {notas?.estadisticas?.totalEvaluaciones || 0} evaluaciones realizadas
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="border-b">
                        <th className="text-left py-3 px-4">Evaluación</th>
                        <th className="text-left py-3 px-4">Unidad</th>
                        <th className="text-left py-3 px-4">Puntaje</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Fecha</th>
                        <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notas?.notas?.map((nota: any) => (
                        <tr key={nota.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                            <div>
                                <p className="font-medium">{nota.evaluacion}</p>
                                <p className="text-sm text-gray-500 capitalize">
                                {nota.tipo === 'examen_final' ? 'Examen Final' : 'Evaluación de Unidad'}
                                </p>
                            </div>
                            </td>
                            <td className="py-3 px-4">
                            {nota.unidad}
                            </td>
                            <td className="py-3 px-4">
                            <div className="text-center">
                                {nota.puntajeObtenido !== null ? (
                                <>
                                    <p className={`text-2xl font-bold ${
                                    nota.aprobado ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {nota.puntajeObtenido}
                                    </p>
                                    <p className="text-sm text-gray-500">/ {nota.puntajeMaximo}</p>
                                    <p className="text-xs text-gray-500">
                                    ({nota.porcentaje}%)
                                    </p>
                                </>
                                ) : (
                                <p className="text-gray-400">No realizado</p>
                                )}
                            </div>
                            </td>
                            <td className="py-3 px-4">
                            <Badge variant={
                                nota.estado === 'calificado' 
                                ? (nota.aprobado ? 'default' : 'destructive')
                                : nota.estado === 'pendiente'
                                ? 'secondary'
                                : 'outline'
                            }>
                                {nota.estado === 'calificado' 
                                ? (nota.aprobado ? 'Aprobado' : 'Desaprobado')
                                : nota.estado === 'pendiente'
                                ? 'Pendiente calificación'
                                : 'No realizado'
                                }
                            </Badge>
                            </td>
                            <td className="py-3 px-4">
                            {nota.fecha ? formatDate(nota.fecha) : '--'}
                            </td>
                            <td className="py-3 px-4">
                            {nota.puntajeObtenido !== null && (
                                <Button size="sm" variant="outline">
                                Ver Detalles
                                </Button>
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* Resumen de Notas */}
                {notas?.estadisticas && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-bold mb-3">Resumen de Notas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded border">
                        <p className="text-sm text-gray-500">Promedio</p>
                        <p className="text-2xl font-bold">
                            {notas.estadisticas.promedio.toFixed(1)}
                        </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded border">
                        <p className="text-sm text-gray-500">Más Alta</p>
                        <p className="text-2xl font-bold text-green-600">
                            {notas.estadisticas.puntajeMaximo}
                        </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded border">
                        <p className="text-sm text-gray-500">Más Baja</p>
                        <p className="text-2xl font-bold text-red-600">
                            {notas.estadisticas.puntajeMinimo}
                        </p>
                        </div>
                        <div className="text-center p-3 bg-white rounded border">
                        <p className="text-sm text-gray-500">Aprobación</p>
                        <p className="text-2xl font-bold text-green-600">
                            {notas.estadisticas.tasaAprobacion}%
                        </p>
                        </div>
                    </div>

                    {/* Gráfico de progreso */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Evaluaciones Realizadas</span>
                            <span>{notas.estadisticas.evaluacionesRealizadas}/{notas.estadisticas.totalEvaluaciones}</span>
                        </div>
                        <Progress value={
                            (notas.estadisticas.evaluacionesRealizadas / notas.estadisticas.totalEvaluaciones) * 100
                        } />
                        </div>
                        <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Tasa de Aprobación</span>
                            <span>{notas.estadisticas.aprobadas}/{notas.estadisticas.evaluacionesRealizadas}</span>
                        </div>
                        <Progress value={notas.estadisticas.tasaAprobacion} className="bg-green-500" />
                        </div>
                    </div>
                    </div>
                )}
                </CardContent>
            </Card>

            {/* Panel de detalle de evaluación (opcional) */}
            {notas?.resultadosCompletos && notas.resultadosCompletos.length > 0 && (
                <Card>
                <CardHeader>
                    <CardTitle>Detalle de Intentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                    {notas.resultadosCompletos.map((resultado: any) => (
                        <div key={resultado.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                            <div>
                            <p className="font-medium">{resultado.evaluacion.titulo}</p>
                            <p className="text-sm text-gray-500">
                                Intento #{resultado.intentoNumero} · 
                                {resultado.calificado ? ' Calificado' : ' Pendiente'}
                            </p>
                            </div>
                            <div className="text-right">
                            <p className="text-lg font-bold">
                                {resultado.puntuacionObtenida}/{resultado.evaluacion.puntuacionMaxima}
                            </p>
                            <p className="text-sm text-gray-500">
                                {resultado.porcentaje}%
                            </p>
                            </div>
                        </div>
                        {resultado.retroalimentacionProfesor && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded">
                            <p className="text-sm font-medium">Retroalimentación:</p>
                            <p className="text-sm">{resultado.retroalimentacionProfesor}</p>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                </CardContent>
                </Card>
            )}
            </TabsContent>

          {/* Pestaña: ZOOM */}
          <TabsContent value="zoom" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Clases Programadas */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Clases en Vivo Programadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clasesZoom.length === 0 ? (
                      <div className="text-center py-8">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay clases programadas</p>
                      </div>
                    ) : (
                      clasesZoom.map((clase) => (
                        <div key={clase.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg">{clase.titulo}</h4>
                              <p className="text-sm text-gray-500">{clase.descripcion}</p>
                            </div>
                            <Badge variant={
                              clase.estado === 'programada' ? 'default' :
                              clase.estado === 'en_progreso' ? 'secondary' :
                              'outline'
                            }>
                              {clase.estado}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Inicio</p>
                              <p className="font-medium">{formatDate(clase.fechaHoraInicio)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fin</p>
                              <p className="font-medium">{formatDate(clase.fechaHoraFin)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1" asChild>
                              <a href={clase.urlZoom} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-2" />
                                Unirse a la Clase
                              </a>
                            </Button>
                            <Button variant="outline">
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Calendario de Clases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Clases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clasesZoom
                      .filter(clase => new Date(clase.fechaHoraInicio) > new Date())
                      .sort((a, b) => new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime())
                      .slice(0, 3)
                      .map((clase) => (
                        <div key={clase.id} className="p-3 border rounded">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{clase.titulo}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(clase.fechaHoraInicio).toLocaleDateString()} · 
                                {new Date(clase.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <Button size="sm" className="mt-2" asChild>
                                <a href={clase.urlZoom} target="_blank">
                                  Unirse
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}