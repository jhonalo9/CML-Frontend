'use client';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, FileText, Calendar, Upload, Clock, AlertCircle,
  Video, Edit, Trash2, Eye, Plus, X, Loader2
} from 'lucide-react';
import profesorAPI from '@/app/src/lib/api/profesor.service';
import { Button } from '@/components/ui/button';

// ==================== INTERFACES ====================
interface Curso {
  id: number;
  nombre: string;
  codigoCurso: string;
  esCurricular?: boolean;
  activo?: boolean;
  _count?: {
    inscripciones?: number;
    unidades?: number;
  };
}

interface Unidad {
  id: number;
  cursoId: number;
  numeroUnidad: number;
  titulo: string;
  descripcion?: string;
  _count?: {
    contenidos?: number;
  };
}

interface Contenido {
  id: number;
  unidadId: number;
  titulo: string;
  descripcion?: string;
  tipoContenido: 'pdf' | 'video_zoom' | 'diapositiva' | 'otro';
  urlArchivo?: string;
  fechaSubida: string;
}

interface ClaseZoom {
  id: number;
  cursoId: number;
  titulo: string;
  descripcion?: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  urlZoom: string;
  meetingId?: string;
  passwordZoom?: string;
  estado: 'programada' | 'pendiente' | 'completada';
  curso?: {
    nombre: string;
  };
}

interface EvaluacionPendiente {
  id: number;
  fechaFinalizacion: string;
  evaluacion?: {
    titulo: string;
    puntuacionMaxima?: number;
  };
  inscripcionCurso?: {
    usuario?: {
      nombres: string;
      apellidos: string;
    };
    curso?: {
      nombre: string;
    };
  };
}

interface DashboardStats {
  totalCursos: number;
  estudiantesActivos: number;
  evaluacionesPendientes: number;
  proximasClases: number;
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function ProfesorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BookOpen },
    { id: 'cursos', label: 'Mis Cursos', icon: BookOpen },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: FileText },
    { id: 'contenidos', label: 'Contenidos', icon: Upload },
    { id: 'clases-zoom', label: 'Clases Zoom', icon: Video },
  ];


  const handleLogout = () => {
    
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/'; // o la ruta que uses para login
    
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Profesor</h1>
              <p className="text-sm text-gray-500">Gestiona tus cursos y evaluaciones</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </button>
            <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white ml-4 cursor-pointer"
              >               
                Cerrar Sesión
              </Button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'cursos' && <CursosTab />}
        {activeTab === 'evaluaciones' && <EvaluacionesTab />}
        {activeTab === 'contenidos' && <ContenidosTab />}
        {activeTab === 'clases-zoom' && <ClasesZoomTab />}
      </main>
    </div>
  );
}

// ==================== COMPONENTES DE TABS ====================

// Tab: Resumen General
function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCursos: 0,
    estudiantesActivos: 0,
    evaluacionesPendientes: 0,
    proximasClases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await profesorAPI.dashboard.obtenerEstadisticas();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cursos Asignados" value={stats.totalCursos} icon={BookOpen} color="blue" />
        <StatCard title="Estudiantes Activos" value={stats.estudiantesActivos} icon={Users} color="green" />
        <StatCard title="Por Calificar" value={stats.evaluacionesPendientes} icon={FileText} color="orange" />
        <StatCard title="Próximas Clases" value={stats.proximasClases} icon={Calendar} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton icon={Upload} label="Subir Material" onClick={() => {}} />
          <QuickActionButton icon={FileText} label="Crear Evaluación" onClick={() => {}} />
          <QuickActionButton icon={Video} label="Programar Clase" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}

// Tab: Mis Cursos
function CursosTab() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      setLoading(true);
      const response = await profesorAPI.cursos.obtenerMisCursosProfesor();
      // Asegurarnos de que la respuesta tenga el formato correcto
      const cursosData = response?.data?.data || response?.data || [];
      setCursos(Array.isArray(cursosData) ? cursosData : []);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mis Cursos ({cursos.length})</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {cursos.map((curso) => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onSelect={() => setSelectedCurso(curso.id)}
              isSelected={selectedCurso === curso.id}
            />
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedCurso ? (
            <CursoDetails cursoId={selectedCurso} />
          ) : (
            <EmptyState icon={BookOpen} message="Selecciona un curso para ver los detalles" />
          )}
        </div>
      </div>
    </div>
  );
}

// Tab: Evaluaciones
function EvaluacionesTab() {
  const [filter, setFilter] = useState('pendientes');
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<EvaluacionPendiente | null>(null);

  useEffect(() => {
    cargarEvaluaciones();
  }, [filter]);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      if (filter === 'pendientes') {
        const response = await profesorAPI.evaluaciones.listarEvaluacionesPendientes();
        // Asegurarnos de que la respuesta sea un array
        const evaluacionesData = response?.data || [];
        setEvaluaciones(Array.isArray(evaluacionesData) ? evaluacionesData : []);
      } else {
        // Cargar todas las evaluaciones
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalificar = (evaluacion: EvaluacionPendiente) => {
    setSelectedEvaluacion(evaluacion);
    setShowCalificarModal(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Evaluaciones</h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nueva Evaluación
        </button>
      </div>

      <div className="flex gap-2">
        {['pendientes', 'calificadas', 'todas'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {evaluaciones.length === 0 ? (
        <EmptyState icon={FileText} message="No hay evaluaciones pendientes" />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluaciones.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.inscripcionCurso?.usuario?.nombres} {item.inscripcionCurso?.usuario?.apellidos}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.evaluacion?.titulo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.inscripcionCurso?.curso?.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(item.fechaFinalizacion).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleCalificar(item)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Calificar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCalificarModal && selectedEvaluacion && (
        <CalificarModal
          evaluacion={selectedEvaluacion}
          onClose={() => {
            setShowCalificarModal(false);
            cargarEvaluaciones();
          }}
        />
      )}
    </div>
  );
}

// Tab: Contenidos
function ContenidosTab() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    cargarCursos();
  }, []);

  useEffect(() => {
    if (selectedCurso) {
      cargarUnidades(parseInt(selectedCurso));
    }
  }, [selectedCurso]);

  const cargarCursos = async () => {
    try {
      const response = await profesorAPI.cursos.listarCursos({ esCurricular: true });
      const cursosData = response?.data?.data || response?.data || [];
      setCursos(Array.isArray(cursosData) ? cursosData : []);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setCursos([]);
    }
  };

  const cargarMisCursos = async () => {
    try {
        const response = await profesorAPI.cursos.obtenerMisCursosProfesor();
        const misCursosProfes = response?.data || [];
        setCursos(Array.isArray(misCursosProfes) ? misCursosProfes : []);
    } catch (error) {
        console.error('Error cargando mis cursos:', error);
        setCursos([]);
    } finally {
        setLoading(false);
    }
  };
  
        

  const cargarUnidades = async (cursoId: number) => {
    try {
      setLoading(true);
      const response = await profesorAPI.cursos.obtenerUnidadesCurso(cursoId);
      const unidadesData = response?.data || [];
      setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
      
      // Cargar contenidos de todas las unidades
      const todosContenidos: Contenido[] = [];
      for (const unidad of unidadesData || []) {
        const contResponse = await profesorAPI.contenidos.obtenerContenidosUnidad(unidad.id);
        const contenidosData = contResponse?.data || [];
        if (Array.isArray(contenidosData)) {
          todosContenidos.push(...contenidosData);
        }
      }
      setContenidos(todosContenidos);
    } catch (error) {
      console.error('Error cargando unidades:', error);
      setUnidades([]);
      setContenidos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este contenido?')) {
      try {
        await profesorAPI.contenidos.eliminarContenido(id);
        if (selectedCurso) {
          cargarUnidades(parseInt(selectedCurso));
        }
      } catch (error) {
        console.error('Error eliminando contenido:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Contenidos</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedCurso}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Subir Contenido
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Curso</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={selectedCurso}
          onChange={(e) => setSelectedCurso(e.target.value)}
        >
          <option value="">Selecciona un curso</option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id.toString()}>{curso.nombre}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : contenidos.length === 0 ? (
        <EmptyState icon={Upload} message="No hay contenidos. Selecciona un curso y sube material." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contenidos.map((item) => (
            <ContenidoCard key={item.id} contenido={item} onEliminar={handleEliminar} />
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          cursos={cursos}
          unidades={unidades.filter(u => u.cursoId === parseInt(selectedCurso))}
          onClose={() => {
            setShowUploadModal(false);
            if (selectedCurso) {
              cargarUnidades(parseInt(selectedCurso));
            }
          }}
        />
      )}
    </div>
  );
}

// Tab: Clases Zoom
function ClasesZoomTab() {
  const [clases, setClases] = useState<ClaseZoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    try {
      setLoading(true);
      const response = await profesorAPI.clasesZoom.obtenerProximasClases();
      const clasesData = response?.data || [];
      setClases(Array.isArray(clasesData) ? clasesData : []);
    } catch (error) {
      console.error('Error cargando clases:', error);
      setClases([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Clases Zoom Programadas</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Programar Clase
        </button>
      </div>

      {clases.length === 0 ? (
        <EmptyState icon={Video} message="No hay clases programadas" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clases.map((clase) => (
            <ClaseZoomCard key={clase.id} clase={clase} onUpdate={cargarClases} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateClaseZoomModal
          onClose={() => {
            setShowCreateModal(false);
            cargarClases();
          }}
        />
      )}
    </div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${colors[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
    >
      <div className="bg-blue-100 p-2 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
}

function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <Icon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

interface CursoCardProps {
  curso: Curso;
  onSelect: () => void;
  isSelected: boolean;
}

function CursoCard({ curso, onSelect, isSelected }: CursoCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{curso.nombre}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {curso.codigoCurso}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {curso._count?.inscripciones || 0}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {curso._count?.unidades || 4} unidades
        </span>
      </div>
    </div>
  );
}

interface CursoDetailsProps {
  cursoId: number;
}

function CursoDetails({ cursoId }: CursoDetailsProps) {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUnidades();
  }, [cursoId]);

  const cargarUnidades = async () => {
    try {
      setLoading(true);
      const response = await profesorAPI.cursos.obtenerUnidadesCurso(cursoId);
      const unidadesData = response?.data || [];
      setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
    } catch (error) {
      console.error('Error cargando unidades:', error);
      setUnidades([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Unidades del Curso</h3>
      <div className="space-y-2">
        {unidades.map((unidad) => (
          <div key={unidad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium">{unidad.titulo}</span>
              <p className="text-xs text-gray-500">{unidad._count?.contenidos || 0} contenidos</p>
            </div>
            <div className="flex gap-2">
              <button className="text-blue-600 hover:text-blue-800">
                <Edit className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-gray-800">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ContenidoCardProps {
  contenido: Contenido;
  onEliminar: (id: number) => void;
}

function ContenidoCard({ contenido, onEliminar }: ContenidoCardProps) {
  const icons: Record<string, React.ElementType> = {
    pdf: FileText,
    video_zoom: Video,
    diapositiva: BookOpen,
    otro: Upload
  };
  
  const Icon = icons[contenido.tipoContenido] || Upload;

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h4 className="font-medium text-gray-900 text-sm truncate">{contenido.titulo}</h4>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {contenido.descripcion || 'Sin descripción'}
      </p>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{new Date(contenido.fechaSubida).toLocaleDateString()}</span>
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEliminar(contenido.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClaseZoomCardProps {
  clase: ClaseZoom;
  onUpdate: () => void;
}

function ClaseZoomCard({ clase, onUpdate }: ClaseZoomCardProps) {
  const estadoColors: Record<string, string> = {
    programada: 'bg-green-100 text-green-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    completada: 'bg-gray-100 text-gray-700'
  };

  const handleIniciar = () => {
    window.open(clase.urlZoom, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">{clase.titulo}</h4>
          <p className="text-sm text-gray-500">{clase.curso?.nombre}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${estadoColors[clase.estado]}`}>
          {clase.estado}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(clase.fechaHoraInicio).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date(clase.fechaHoraInicio).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleIniciar}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Iniciar Clase
        </button>
        <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== MODALES ====================

interface CalificarModalProps {
  evaluacion: EvaluacionPendiente;
  onClose: () => void;
}

function CalificarModal({ evaluacion, onClose }: CalificarModalProps) {
  const [puntuacion, setPuntuacion] = useState('');
  const [retroalimentacion, setRetroalimentacion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    try {
      setSaving(true);
      await profesorAPI.evaluaciones.calificarEvaluacion(evaluacion.id, {
        puntuacionObtenida: parseFloat(puntuacion),
        retroalimentacion
      });
      alert('Evaluación calificada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error calificando:', error);
      alert('Error al calificar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Calificar Evaluación</h3>
              <p className="text-sm text-gray-500">
                {evaluacion?.inscripcionCurso?.usuario?.nombres} - {evaluacion?.evaluacion?.titulo}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntuación Obtenida (0-{evaluacion?.evaluacion?.puntuacionMaxima || 20})
              </label>
              <input
                type="number"
                min="0"
                max={evaluacion?.evaluacion?.puntuacionMaxima || 20}
                step="0.5"
                value={puntuacion}
                onChange={(e) => setPuntuacion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="14.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retroalimentación
              </label>
              <textarea
                value={retroalimentacion}
                onChange={(e) => setRetroalimentacion(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe comentarios para el estudiante..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving || !puntuacion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Calificación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UploadModalProps {
  cursos: Curso[];
  unidades: Unidad[];
  onClose: () => void;
}

function UploadModal({ cursos, unidades, onClose }: UploadModalProps) {
  const [formData, setFormData] = useState({
    cursoId: '',
    unidadId: '',
    titulo: '',
    descripcion: '',
    tipoContenido: 'pdf' as 'pdf' | 'video_zoom' | 'diapositiva' | 'otro',
    orden: 1
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file || !formData.unidadId || !formData.titulo) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = profesorAPI.upload.crearFormDataContenido({
        file,
        unidadId: parseInt(formData.unidadId),
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipoContenido: formData.tipoContenido,
        orden: formData.orden
      });

      await profesorAPI.contenidos.subirContenido(formDataUpload);
      alert('Contenido subido exitosamente');
      onClose();
    } catch (error) {
      console.error('Error subiendo contenido:', error);
      alert('Error al subir el contenido');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Subir Contenido</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.cursoId}
                onChange={(e) => setFormData({...formData, cursoId: e.target.value, unidadId: ''})}
              >
                <option value="">Seleccionar curso</option>
                {cursos.map((c) => (<option key={c.id} value={c.id.toString()}>{c.nombre}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.unidadId}
                onChange={(e) => setFormData({...formData, unidadId: e.target.value})}
                disabled={!formData.cursoId}
              >
                <option value="">Seleccionar unidad</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id.toString()}>{u.titulo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.tipoContenido}
                onChange={(e) => setFormData({...formData, tipoContenido: e.target.value as any})}
              >
                <option value="pdf">PDF</option>
                <option value="video_zoom">Video Zoom</option>
                <option value="diapositiva">Diapositiva</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo *</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Subir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateClaseZoomModalProps {
  onClose: () => void;
}

function CreateClaseZoomModal({ onClose }: CreateClaseZoomModalProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [formData, setFormData] = useState({
    cursoId: '',
    unidadId: '',
    titulo: '',
    descripcion: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
    urlZoom: '',
    meetingId: '',
    passwordZoom: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const response = await profesorAPI.cursos.listarCursos({ esCurricular: true });
      const cursosData = response?.data?.data || response?.data || [];
      setCursos(Array.isArray(cursosData) ? cursosData : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  

  const handleSubmit = async () => {
    if (!formData.cursoId || !formData.titulo || !formData.fechaHoraInicio || !formData.urlZoom) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      await profesorAPI.clasesZoom.programarClaseZoom({
        ...formData,
        cursoId: parseInt(formData.cursoId),
        unidadId: formData.unidadId ? parseInt(formData.unidadId) : undefined
      });
      alert('Clase programada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al programar la clase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Programar Clase Zoom</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.cursoId}
                onChange={(e) => setFormData({...formData, cursoId: e.target.value})}
              >
                <option value="">Seleccionar curso</option>
                {cursos.map((c) => (<option key={c.id} value={c.id.toString()}>{c.nombre}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha/Hora Inicio *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.fechaHoraInicio}
                onChange={(e) => setFormData({...formData, fechaHoraInicio: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha/Hora Fin *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.fechaHoraFin}
                onChange={(e) => setFormData({...formData, fechaHoraFin: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Zoom *</label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.urlZoom}
                onChange={(e) => setFormData({...formData, urlZoom: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Programar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}