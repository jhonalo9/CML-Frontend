"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, BookOpen, BarChart3, Settings, Plus, Edit, Trash2, 
  Search, DollarSign, CheckCircle, XCircle, Clock, Video,
  UserCheck, FileText, Calendar, ExternalLink, AlertCircle,
  TrendingUp, GraduationCap, CreditCard, Percent, Layers,
  Upload, PlayCircle, FileVideo, FileTextIcon, CalendarDays,
  Link, Lock, Download, Eye, Maximize, FolderOpen, Globe
} from 'lucide-react';

// Servicios API
const API_BASE_URL = 'http://localhost:5000/api';

// Interfaces TypeScript basadas en tu backend
interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  dni: string;
  telefono?: string;
  tipoUsuario: 'administrador' | 'profesor' | 'estudiante';
  estado: string;
}

interface Curso {
  id: number;
  nombre: string;
  codigoCurso: string;
  descripcion: string;
  precio: number;
  numeroOrden: number;
  duracionSemanas: number;
  esCurricular?: boolean;
  tieneExamenFinal?: boolean;
  activo?: boolean;
  fechaCreacion?: string;
  totalUnidades?: number;
  profesores?: Array<{
    id: number;
    esPrincipal: boolean;
    profesor: {
      id: number;
      nombres: string;
      apellidos: string;
      email: string;
    };
  }>;
}

interface Unidad {
  id: number;
  cursoId: number;
  numeroUnidad: number;
  titulo: string;
  descripcion: string;
  orden: number;
  contenido?: Contenido[];
  clasesZoom?: ClaseZoom[];
}

interface ClaseZoom {
  id: number;
  cursoId: number;
  unidadId: number;
  titulo: string;
  descripcion: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  urlZoom: string;
  passwordZoom?: string;
  estado: 'programada' | 'en_progreso' | 'finalizada' | 'cancelada';
}

interface Contenido {
  id: number;
  unidadId: number;
  titulo: string;
  descripcion: string;
  tipoContenido: 'video_zoom' | 'pdf' | 'diapositiva' | 'otro' | 'enlace';
  urlArchivo?: string;
  urlEmbed?: string | null;        // ⬅️ NUEVO
  driveFileId?: string | null;     // ⬅️ NUEVO
  urlThumbnail?: string;
  duracionMinutos?: number;
  orden: number;
  fechaSubida: string;
  tamanoMb?: number;               // ⬅️ NUEVO
  enlaces?: {                      // ⬅️ NUEVO (viene del backend)
    ver: string;
    embed: string | null;
    descarga: string;
  };
}

interface Pago {
  id: number;
  monto: number;
  tipoPago: 'matricula' | 'curso';
  estado: 'pendiente_validacion' | 'completado' | 'fallido';
  metodoPago: 'stripe' | 'yape' | 'tarjeta';
  referenciaExterna?: string;
  codigoTransaccion: string;
  fechaPago: string;
  comprobanteUrl?: string;
  detallesPago?: {
    razonRechazo?: string;
    // ← AÑADIR ESTA LÍNEA
    [key: string]: any;
  };
  usuario: Usuario;
}

// Interfaces para las estadísticas
interface EstadisticasResponse {
  success: boolean;
  data?: {
    conteos: {
      usuarios: number;
      estudiantes: number;
      profesores: number;
      administradores: number;
      cursos: number;
      matriculas: number;
      inscripciones: number;
      pagos: number;
    };
    estados: {
      usuarios: {
        activos: number;
        inactivos: number;
      };
      cursos: {
        activos: number;
        inactivos: number;
      };
      matriculas: {
        activas: number;
        inactivas: number;
      };
      pagos: {
        completados: number;
        pendientes: number;
        fallidos: number;
      };
    };
    monetario: {
      totalRecaudado: number;
      promedioPago: number;
      distribucionPagos: {
        matricula: number;
        curso: number;
        curso_adicional: number;
      };
    };
    progreso: {
      inscripcionesCompletadas: number;
      tasaCompletacion: number;
    };
    crecimiento: {
      usuarios: number;
      cursos: number;
      matriculas: number;
      pagos: number;
      periodo: string;
    };
    recientes: {
      usuarios: Array<{
        id: number;
        nombres: string;
        apellidos: string;
        email: string;
        tipoUsuario: string;
        fechaRegistro: string;
      }>;
      cursos: Array<{
        id: number;
        nombre: string;
        codigoCurso: string;
        activo: boolean;
        fechaCreacion: string;
      }>;
      matriculas: Array<{
        id: number;
        codigoMatricula: string;
        activa: boolean;
        fechaMatricula: string;
        estadoPago: string;
        usuario: {
          nombres: string;
          apellidos: string;
          email: string;
        };
      }>;
      pagos: Array<{
        id: number;
        tipoPago: string;
        monto: string;
        estado: string;
        fechaPago: string;
        usuario: {
          nombres: string;
          apellidos: string;
        };
      }>;
    };
  };
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ApiUsuariosResponse {
  success: boolean;
  data?: {
    usuarios: Usuario[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  message?: string;
}

// Tipo para los mensajes que incluye string vacío
type MessageType = 'success' | 'error' | 'warning' | 'info' | '';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [clasesZoom, setClasesZoom] = useState<ClaseZoom[]>([]);
  const [imagenPortada, setImagenPortada] = useState<File | null>(null);
  const [previewPortada, setPreviewPortada] = useState<string>('');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalCursos: 0,
    pagosPendientes: 0,
    ingresosMes: 0,
    totalEstudiantes: 0,
    totalProfesores: 0,
    totalAdministradores: 0,
    tasaCompletacion: 0,
    promedioPago: 0
  });
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<number | null>(null);
  
  // Formularios - INICIALIZADOS CORRECTAMENTE
  const [cursoForm, setCursoForm] = useState({
    nombre: '',
    codigoCurso: '',
    descripcion: '',
    precio: '',
    numeroOrden: '',
    duracionSemanas: '4',
    totalUnidades: '4',
     esCurricular: true,
  tieneExamenFinal: true
  });

  const [unidadForm, setUnidadForm] = useState({
    cursoId: 0,
    numeroUnidad: '',
    titulo: '',
    descripcion: '',
    orden: '',
   
  });

  const [claseZoomForm, setClaseZoomForm] = useState({
    cursoId: 0,
    unidadId: 0,
    titulo: '',
    descripcion: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
    urlZoom: '',
    passwordZoom: ''
  });

  const [contenidoForm, setContenidoForm] = useState({
    unidadId: 0,
    titulo: '',
    descripcion: '',
    tipoContenido: 'video_zoom' as 'video_zoom' | 'pdf' | 'diapositiva' | 'otro' | 'enlace',
    urlArchivo: '',
    duracionMinutos: '',
    orden: ''
  });

  // Agregar este estado al inicio del componente
const [pagoDetalle, setPagoDetalle] = useState<Pago | null>(null);
const [isDetallesPagoOpen, setIsDetallesPagoOpen] = useState(false);



const [profesores, setProfesores] = useState<Usuario[]>([]);
const [isAsignarProfesorDialogOpen, setIsAsignarProfesorDialogOpen] = useState(false);
const [asignarProfesorForm, setAsignarProfesorForm] = useState({
  cursoId: 0,
  profesorId: 0,
  esPrincipal: false
});

// Agregar esta función para cargar profesores
const loadProfesores = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/usuarios?tipoUsuario=profesor`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      const profesoresFiltrados = Array.isArray(data.data.usuarios) 
        ? data.data.usuarios.filter((u: Usuario) => u.tipoUsuario === 'profesor')
        : [];
      setProfesores(profesoresFiltrados);
    }
  } catch (error) {
    console.error('Error loading profesores:', error);
  }
};


const handlePortadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setImagenPortada(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPortada(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

// Agregar esta función para asignar profesor
const handleAsignarProfesor = async () => {
  if (!asignarProfesorForm.cursoId || !asignarProfesorForm.profesorId) {
    showMessage('error', 'Por favor selecciona un curso y un profesor');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/cursos/asignar-profesor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(asignarProfesorForm)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('success', 'Profesor asignado exitosamente');
      setAsignarProfesorForm({
        cursoId: 0,
        profesorId: 0,
        esPrincipal: false
      });
      setIsAsignarProfesorDialogOpen(false);
      if (cursoSeleccionado) {
        await handleSeleccionarCurso(cursoSeleccionado);
      }
    } else {
      showMessage('error', data.message || 'Error al asignar profesor');
    }
  } catch (error) {
    showMessage('error', 'Error al asignar profesor');
    console.error('Error asignando profesor:', error);
  } finally {
    setLoading(false);
  }
};

// Función para abrir el diálogo de asignar profesor
const abrirDialogoAsignarProfesor = () => {
  if (!cursoSeleccionado) {
    showMessage('warning', 'Primero selecciona un curso');
    return;
  }
  setAsignarProfesorForm(prev => ({
    ...prev,
    cursoId: cursoSeleccionado
  }));
  setIsAsignarProfesorDialogOpen(true);
};

// Modificar el useEffect para cargar profesores
useEffect(() => {
  loadDashboardData();
  loadProfesores(); // Agregar esta línea
}, []);

  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClaseDialogOpen, setIsClaseDialogOpen] = useState(false);

  const [isCursoModalOpen, setIsCursoModalOpen] = useState(false);
const [isEditMode, setIsEditMode] = useState(false);
const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  
  const [message, setMessage] = useState<{ type: MessageType; text: string }>({ 
    type: '', 
    text: '' 
  });

  useEffect(() => {
    console.log('AdminDashboard montado, cargando datos...');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    console.log('Iniciando carga de datos del dashboard');
    setLoading(true);
    try {
      await Promise.all([
        loadEstadisticas(),
        loadCursos(),
        loadUsuarios(),
        loadPagosPendientes(),
      ]);
      console.log('Datos del dashboard cargados exitosamente');
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      showMessage('error', 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/estadisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data: EstadisticasResponse = await response.json();
      
      if (data.success && data.data) {
        setEstadisticas(data.data);
        setStats({
          totalUsuarios: data.data.conteos.usuarios,
          totalCursos: data.data.conteos.cursos,
          pagosPendientes: data.data.estados.pagos.pendientes,
          ingresosMes: data.data.monetario.totalRecaudado,
          totalEstudiantes: data.data.conteos.estudiantes,
          totalProfesores: data.data.conteos.profesores,
          totalAdministradores: data.data.conteos.administradores,
          tasaCompletacion: data.data.progreso.tasaCompletacion,
          promedioPago: data.data.monetario.promedioPago
        });
      }
    } catch (error) {
      console.error('Error loading estadísticas:', error);
      showMessage('warning', 'No se pudieron cargar las estadísticas completas');
    }
  };


  const handleVerDetallesPago = (pago: Pago) => {
  setPagoDetalle(pago);
  setIsDetallesPagoOpen(true);
};

  const loadCursos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cursos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data: ApiResponse<Curso[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCursos(data.data);
      } else {
        setCursos([]);
      }
    } catch (error) {
      console.error('Error loading cursos:', error);
      setCursos([]);
      showMessage('error', 'Error al cargar cursos');
    }
  };

  const loadUnidadesPorCurso = async (cursoId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/unidades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data: ApiResponse<Unidad[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setUnidades(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error loading unidades:', error);
      showMessage('error', 'Error al cargar unidades');
    }
    return [];
  };

  const loadContenidosPorUnidad = async (unidadId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/contenidos/unidad/${unidadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data: ApiResponse<Contenido[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setContenidos(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error loading contenidos:', error);
      showMessage('error', 'Error al cargar contenido');
    }
    return [];
  };

  const loadClasesZoomPorCurso = async (cursoId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/clases-zoom`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data: ApiResponse<ClaseZoom[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setClasesZoom(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error loading clases Zoom:', error);
      showMessage('error', 'Error al cargar clases Zoom');
    }
    return [];
  };

  const loadUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data: ApiUsuariosResponse = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.usuarios)) {
        setUsuarios(data.data.usuarios);
      } else if (data.success && Array.isArray(data.data)) {
        setUsuarios(data.data as unknown as Usuario[]);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error loading usuarios:', error);
      setUsuarios([]);
      showMessage('error', 'Error al cargar usuarios');
    }
  };

// Agregar logs para debugging - CORREGIDO
const loadPagosPendientes = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'Existe' : 'No existe');
    
    const response = await fetch(`${API_BASE_URL}/pagos/admin/pendientes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📡 Status:', response.status);
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    console.log('📦 Data completa:', data);
    
    // ✅ CAMBIO IMPORTANTE: Acceder a data.data.pagos en lugar de data.data
    if (data.success && data.data && Array.isArray(data.data.pagos)) {
      console.log('✅ Pagos cargados:', data.data.pagos.length);
      setPagos(data.data.pagos); // ← AQUÍ ESTÁ EL CAMBIO
    } else {
      console.log('⚠️ No hay pagos o estructura incorrecta');
      setPagos([]);
    }
  } catch (error) {
    console.error('❌ Error loading pagos:', error);
    setPagos([]);
    showMessage('error', 'Error al cargar pagos: ' + (error as Error).message);
  }
};

  const showMessage = (type: Exclude<MessageType, ''>, text: string) => {
    console.log(`Mensaje [${type}]:`, text);
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // CRUD Cursos
  const handleCreateCurso = async () => {
  if (!cursoForm.nombre || !cursoForm.codigoCurso || !cursoForm.precio || !cursoForm.numeroOrden) {
    showMessage('error', 'Por favor completa todos los campos requeridos');
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('nombre', cursoForm.nombre);
    formData.append('codigoCurso', cursoForm.codigoCurso);
    formData.append('descripcion', cursoForm.descripcion);
    formData.append('precio', cursoForm.precio);
    formData.append('numeroOrden', cursoForm.numeroOrden);
    formData.append('duracionSemanas', cursoForm.duracionSemanas);
    formData.append('totalUnidades', cursoForm.totalUnidades);
    formData.append('esCurricular', cursoForm.esCurricular.toString());
    formData.append('tieneExamenFinal', cursoForm.tieneExamenFinal.toString());
    
    if (imagenPortada) {
      formData.append('imagenPortada', imagenPortada);
    }

    const endpoint = isEditMode && cursoEditando 
      ? `${API_BASE_URL}/cursos/${cursoEditando.id}`
      : `${API_BASE_URL}/cursos`;
    
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('success', isEditMode ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente');
      setCursoForm({
        nombre: '',
        codigoCurso: '',
        descripcion: '',
        precio: '',
        numeroOrden: '',
        duracionSemanas: '4',
        totalUnidades: '4',
        esCurricular: true,
        tieneExamenFinal: true
      });
      setImagenPortada(null);
      setPreviewPortada('');
      setIsCursoModalOpen(false);
      loadCursos();
      loadEstadisticas();
    } else {
      showMessage('error', data.message || (isEditMode ? 'Error al actualizar curso' : 'Error al crear curso'));
    }
  } catch (error) {
    showMessage('error', isEditMode ? 'Error al actualizar curso' : 'Error al crear curso');
    console.error('Error creating/updating curso:', error);
  } finally {
    setLoading(false);
  }
};

const abrirModalCrearCurso = () => {
  setIsEditMode(false);
  setCursoEditando(null);
  setCursoForm({
    nombre: '',
    codigoCurso: '',
    descripcion: '',
    precio: '',
    numeroOrden: '',
    duracionSemanas: '4',
    totalUnidades: '4',
    esCurricular: true,
    tieneExamenFinal: true
  });
  setImagenPortada(null);
  setPreviewPortada('');
  setIsCursoModalOpen(true);
};

// Función para abrir el modal de edición de curso
const abrirModalEditarCurso = (curso: Curso) => {
  setIsEditMode(true);
  setCursoEditando(curso);
  setCursoForm({
    nombre: curso.nombre || '',
    codigoCurso: curso.codigoCurso || '',
    descripcion: curso.descripcion || '',
    precio: curso.precio?.toString() || '0',
    numeroOrden: curso.numeroOrden?.toString() || '1',
    duracionSemanas: curso.duracionSemanas?.toString() || '4',
    totalUnidades: (curso.totalUnidades || 4).toString(),
    esCurricular: curso.esCurricular ?? true,
    tieneExamenFinal: curso.tieneExamenFinal ?? true
  });
  setImagenPortada(null);
  setPreviewPortada('');
  setIsCursoModalOpen(true);
};
  const handleDeleteCurso = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Curso eliminado exitosamente');
        loadCursos();
        loadEstadisticas();
      } else {
        showMessage('error', data.message || 'Error al eliminar curso');
      }
    } catch (error) {
      showMessage('error', 'Error al eliminar curso');
      console.error('Error deleting curso:', error);
    }
  };

  // Gestión de Unidades - CORREGIDO
  const handleCreateUnidad = async () => {
    // Asegurarnos de que cursoSeleccionado esté asignado al formulario
    const unidadData = {
      ...unidadForm,
      cursoId: cursoSeleccionado || unidadForm.cursoId,
      numeroUnidad: parseInt(unidadForm.numeroUnidad) || 1,
      orden: parseInt(unidadForm.orden) || 1
    };

    console.log('Datos de unidad a enviar:', unidadData);

    if (!unidadData.cursoId || !unidadData.titulo || !unidadData.orden) {
      showMessage('error', 'Por favor completa los campos requeridos: título y orden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cursos/unidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(unidadData)
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Unidad creada exitosamente');
        setUnidadForm({
          cursoId: 0,
          numeroUnidad: '',
          titulo: '',
          descripcion: '',
          orden: ''
        });
        setIsDialogOpen(false); // Cerrar el diálogo
        if (cursoSeleccionado) {
          await loadUnidadesPorCurso(cursoSeleccionado);
        }
      } else {
        showMessage('error', data.message || 'Error al crear unidad');
      }
    } catch (error) {
      showMessage('error', 'Error al crear unidad');
      console.error('Error creating unidad:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestión de Clases Zoom - CORREGIDO
  const handleCreateClaseZoom = async () => {
    // Asegurarnos de que cursoSeleccionado esté asignado al formulario
    const claseData = {
      ...claseZoomForm,
      cursoId: cursoSeleccionado || claseZoomForm.cursoId,
      unidadId: claseZoomForm.unidadId || 0 // Puede ser 0 si no está asociada a unidad específica
    };

    console.log('Datos de clase Zoom a enviar:', claseData);

    if (!claseData.cursoId || !claseData.titulo || !claseData.fechaHoraInicio || !claseData.urlZoom) {
      showMessage('error', 'Por favor completa los campos requeridos: título, fecha/hora de inicio y URL de Zoom');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cursos/clases-zoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(claseData)
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Clase Zoom programada exitosamente');
        setClaseZoomForm({
          cursoId: 0,
          unidadId: 0,
          titulo: '',
          descripcion: '',
          fechaHoraInicio: '',
          fechaHoraFin: '',
          urlZoom: '',
          passwordZoom: ''
        });
        setIsClaseDialogOpen(false); // Cerrar el diálogo
        if (cursoSeleccionado) {
          await loadClasesZoomPorCurso(cursoSeleccionado);
        }
      } else {
        showMessage('error', data.message || 'Error al programar clase Zoom');
      }
    } catch (error) {
      showMessage('error', 'Error al programar clase Zoom');
      console.error('Error creating clase Zoom:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestión de Contenido - CORREGIDO
  const handleUploadContenido = async () => {
    // Asegurarnos de que unidadSeleccionada esté asignada al formulario
    const contenidoData = {
      ...contenidoForm,
      unidadId: unidadSeleccionada || contenidoForm.unidadId,
      orden: parseInt(contenidoForm.orden) || 1,
      duracionMinutos: contenidoForm.duracionMinutos ? parseInt(contenidoForm.duracionMinutos) : undefined
    };

    console.log('Datos de contenido a enviar:', contenidoData);
    console.log('Archivo seleccionado:', archivoSeleccionado);
    console.log('Tipo de contenido:', contenidoData.tipoContenido);

    // Validación corregida
    if (!contenidoData.unidadId || !contenidoData.titulo) {
      showMessage('error', 'Por favor completa los campos requeridos: título');
      return;
    }

    // Validación específica por tipo de contenido
    if (contenidoData.tipoContenido === 'enlace' && !contenidoData.urlArchivo) {
      showMessage('error', 'Para contenido tipo enlace, debes proporcionar una URL');
      return;
    }

    if (contenidoData.tipoContenido !== 'enlace' && !archivoSeleccionado) {
      showMessage('error', 'Para contenido que no es enlace, debes seleccionar un archivo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('unidadId', contenidoData.unidadId.toString());
      formData.append('titulo', contenidoData.titulo);
      formData.append('descripcion', contenidoData.descripcion || '');
      formData.append('tipoContenido', contenidoData.tipoContenido);
      formData.append('orden', contenidoData.orden.toString());
      
      if (contenidoData.duracionMinutos) {
        formData.append('duracionMinutos', contenidoData.duracionMinutos.toString());
      }
      
      if (archivoSeleccionado) {
        formData.append('file', archivoSeleccionado);
      } else if (contenidoData.urlArchivo) {
        formData.append('urlArchivo', contenidoData.urlArchivo);
      }

      console.log('Enviando formData con:', {
        unidadId: contenidoData.unidadId,
        titulo: contenidoData.titulo,
        tipoContenido: contenidoData.tipoContenido,
        tieneArchivo: !!archivoSeleccionado,
        tieneURL: !!contenidoData.urlArchivo
      });

      const response = await fetch(`${API_BASE_URL}/contenidos/subir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // NO incluir 'Content-Type' para FormData, el navegador lo hace automáticamente
        },
        body: formData
      });
      
      console.log('Respuesta status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Respuesta data:', data);
      
      if (data.success) {
        showMessage('success', 'Contenido subido exitosamente');
        setContenidoForm({
          unidadId: 0,
          titulo: '',
          descripcion: '',
          tipoContenido: 'video_zoom',
          urlArchivo: '',
          duracionMinutos: '',
          orden: ''
        });
        setArchivoSeleccionado(null);
        if (unidadSeleccionada) {
          await loadContenidosPorUnidad(unidadSeleccionada);
        }
      } else {
        showMessage('error', data.message || 'Error al subir contenido');
      }
    } catch (error) {
      showMessage('error', 'Error al subir contenido: ' + (error as Error).message);
      console.error('Error uploading contenido:', error);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar/Rechazar Pagos
  const handleConfirmarPago = async (pagoId: number) => {
  //if (!confirm('¿Estás seguro de confirmar este pago?')) return;
  
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/pagos/admin/${pagoId}/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        accion: 'aprobar' // ✅ ESTE ERA EL CAMPO QUE FALTABA
      })
    });
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('success', 'Pago confirmado exitosamente');
      await loadPagosPendientes();
      await loadEstadisticas();
    } else {
      showMessage('error', data.message || 'Error al confirmar pago');
    }
  } catch (error) {
    showMessage('error', 'Error al confirmar pago');
    console.error('Error confirming pago:', error);
  } finally {
    setLoading(false);
  }
};

  const handleRechazarPago = async (pagoId: number) => {
  const razonRechazo = prompt('Motivo del rechazo:');
  if (!razonRechazo) {
    showMessage('warning', 'Debes ingresar un motivo para rechazar el pago');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/pagos/admin/${pagoId}/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        accion: 'rechazar', // ✅ CAMPO CORRECTO
        razonRechazo // ✅ RAZÓN DEL RECHAZO
      })
    });
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('success', 'Pago rechazado exitosamente');
      await loadPagosPendientes();
      await loadEstadisticas();
    } else {
      showMessage('error', data.message || 'Error al rechazar pago');
    }
  } catch (error) {
    showMessage('error', 'Error al rechazar pago');
    console.error('Error rejecting pago:', error);
  } finally {
    setLoading(false);
  }
};

  const handleSeleccionarCurso = async (cursoId: number) => {
    setCursoSeleccionado(cursoId);
    setUnidadSeleccionada(null); // Resetear unidad seleccionada
    setContenidos([]); // Limpiar contenidos
    await Promise.all([
      loadUnidadesPorCurso(cursoId),
      loadClasesZoomPorCurso(cursoId)
    ]);
  };

  const handleSeleccionarUnidad = async (unidadId: number) => {
    setUnidadSeleccionada(unidadId);
    // Actualizar el formulario de contenido con la unidadId
    setContenidoForm(prev => ({
      ...prev,
      unidadId
    }));
    await loadContenidosPorUnidad(unidadId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoSeleccionado(e.target.files[0]);
    }
  };

  const getIconoTipoContenido = (tipo: string) => {
    switch (tipo) {
      case 'video_zoom': return <PlayCircle className="h-5 w-5 text-red-500" />;
      case 'pdf': return <FileTextIcon className="h-5 w-5 text-red-600" />;
      case 'diapositiva': return <FileVideo className="h-5 w-5 text-orange-500" />;
      case 'enlace': return <Link className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para abrir diálogo de unidad con cursoId preestablecido
  const abrirDialogoUnidad = () => {
    if (!cursoSeleccionado) {
      showMessage('warning', 'Primero selecciona un curso');
      return;
    }
    // Pre-llenar el formulario con el curso seleccionado
    setUnidadForm(prev => ({
      ...prev,
      cursoId: cursoSeleccionado,
      numeroUnidad: (unidades.length + 1).toString(),
      orden: (unidades.length + 1).toString()
    }));
    setIsDialogOpen(true);
  };

  // Función para abrir diálogo de clase Zoom con cursoId preestablecido
  const abrirDialogoClaseZoom = () => {
    if (!cursoSeleccionado) {
      showMessage('warning', 'Primero selecciona un curso');
      return;
    }
    // Pre-llenar el formulario con el curso seleccionado
    setClaseZoomForm(prev => ({
      ...prev,
      cursoId: cursoSeleccionado
    }));
    setIsClaseDialogOpen(true);
  };

  const filteredUsuarios = Array.isArray(usuarios) 
    ? usuarios.filter((usuario: Usuario) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          usuario.nombres?.toLowerCase().includes(searchLower) ||
          usuario.apellidos?.toLowerCase().includes(searchLower) ||
          usuario.dni?.includes(searchTerm) ||
          usuario.email?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  if (loading && !cursos.length && !usuarios.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

   const handleLogout = () => {
    
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/'; // o la ruta que uses para login
    
  };

  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };
const currentUser = getUserData();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="mt-2 text-purple-100">Gestión completa del sistema</p>
        </div>
          {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 font-bold">
                    {currentUser.nombres?.charAt(0) || 'A'}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {currentUser.nombres} {currentUser.apellidos}
                    </p>
                    <p className="text-xs text-purple-200">
                      {currentUser.tipoUsuario || 'Administrador'}
                    </p>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
         
        
      </div>

      {/* Modal para Crear/Editar Curso */}
<Dialog open={isCursoModalOpen} onOpenChange={setIsCursoModalOpen}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {isEditMode ? 'Editar Curso' : 'Crear Nuevo Curso'}
      </DialogTitle>
      <DialogDescription>
        {isEditMode ? 'Modifica los datos del curso seleccionado' : 'Completa los datos para crear un nuevo curso'}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="nombre">Nombre del Curso *</Label>
        <Input
          id="nombre"
          value={cursoForm.nombre}
          onChange={(e) => setCursoForm({...cursoForm, nombre: e.target.value})}
          placeholder="Ej: Marketing Digital"
        />
      </div>
      <div>
        <Label htmlFor="codigo">Código *</Label>
        <Input
          id="codigo"
          value={cursoForm.codigoCurso}
          onChange={(e) => setCursoForm({...cursoForm, codigoCurso: e.target.value})}
          placeholder="Ej: MKT101"
          disabled={isEditMode}
        />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={cursoForm.descripcion}
          onChange={(e) => setCursoForm({...cursoForm, descripcion: e.target.value})}
          placeholder="Descripción breve del curso"
          rows={3}
        />
      </div>
      
      {/* Campo para imagen de portada */}
      <div className="relative">
        <Label
          htmlFor="portada"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 cursor-pointer border rounded-md px-4 py-2 w-fit transition-colors"
        >
          <Upload className="h-4 w-4" />
          {isEditMode ? 'Cambiar imagen de portada' : 'Subir imagen de portada'}
        </Label>
        <Input
          id="portada"
          type="file"
          accept="image/*"
          onChange={handlePortadaChange}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-1">
          Formatos: JPG, PNG, WEBP (máx. 5MB)
        </p>

        {previewPortada && (
          <div className="mt-3 relative">
            <img
              src={previewPortada}
              alt="Preview portada"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setImagenPortada(null);
                setPreviewPortada('');
              }}
              className="absolute top-2 right-2 bg-white/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="precio">Precio (S/) *</Label>
          <Input
            id="precio"
            type="number"
            value={cursoForm.precio}
            onChange={(e) => setCursoForm({...cursoForm, precio: e.target.value})}
            placeholder="850"
          />
        </div>
        <div>
          <Label htmlFor="orden">Número de Orden *</Label>
          <Input
            id="orden"
            type="number"
            value={cursoForm.numeroOrden}
            onChange={(e) => setCursoForm({...cursoForm, numeroOrden: e.target.value})}
            placeholder="1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duracion">Duración (semanas)</Label>
          <Input
            id="duracion"
            type="number"
            value={cursoForm.duracionSemanas}
            onChange={(e) => setCursoForm({...cursoForm, duracionSemanas: e.target.value})}
            placeholder="4"
          />
        </div>
        <div>
          <Label htmlFor="totalUnidades">Total de Unidades</Label>
          <Input
            id="totalUnidades"
            type="number"
            value={cursoForm.totalUnidades}
            onChange={(e) => setCursoForm({...cursoForm, totalUnidades: e.target.value})}
            placeholder="4"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="esCurricular"
      checked={cursoForm.esCurricular}
      onChange={(e) => setCursoForm({...cursoForm, esCurricular: e.target.checked})}
      className="h-4 w-4 rounded border-gray-300"
    />
    <Label htmlFor="esCurricular" className="text-sm font-normal">
      Es Curricular
    </Label>
  </div>
  
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="tieneExamenFinal"
      checked={cursoForm.tieneExamenFinal}
      onChange={(e) => setCursoForm({...cursoForm, tieneExamenFinal: e.target.checked})}
      className="h-4 w-4 rounded border-gray-300"
    />
    <Label htmlFor="tieneExamenFinal" className="text-sm font-normal">
      Tiene Examen Final
    </Label>
  </div>
</div>
    
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => setIsCursoModalOpen(false)}
      >
        Cancelar
      </Button>
      <Button 
        onClick={handleCreateCurso} 
        disabled={loading}
      >
        {loading ? (
          'Procesando...'
        ) : (
          isEditMode ? 'Actualizar Curso' : 'Crear Curso'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes */}
        {message.text && (
          <Alert className={`mb-6 ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200' 
              : message.type === 'warning' 
              ? 'bg-yellow-50 border-yellow-200' 
              : message.type === 'info' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <AlertDescription className={
              message.type === 'error' 
                ? 'text-red-800' 
                : message.type === 'warning' 
                ? 'text-yellow-800' 
                : message.type === 'info' 
                ? 'text-blue-800' 
                : 'text-green-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards (mantener igual) */}
        {/* ... */}

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
          </TabsList>

          {/* Overview Tab (mantener igual) */}
         <TabsContent value="overview">
                     <Card>
                       <CardHeader>
                         <CardTitle>Acciones Rápidas</CardTitle>
                         <CardDescription>Gestiona el sistema desde aquí</CardDescription>
                       </CardHeader>
                       <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         <Button onClick={abrirModalCrearCurso} variant="outline" className="h-24 flex flex-col gap-2">
                          <Plus className="h-6 w-6" />
                          Crear Nuevo Curso
                        </Button>
                         <Button onClick={() => setActiveTab('usuarios')} variant="outline" className="h-24 flex flex-col gap-2">
                           <UserCheck className="h-6 w-6" />
                           Gestionar Usuarios
                         </Button>
                         <Button onClick={() => setActiveTab('pagos')} variant="outline" className="h-24 flex flex-col gap-2">
                           <DollarSign className="h-6 w-6" />
                           Revisar Pagos
                         </Button>
                         <Button variant="outline" className="h-24 flex flex-col gap-2">
                           <BarChart3 className="h-6 w-6" />
                           Ver Reportes
                         </Button>
                         <Button variant="outline" className="h-24 flex flex-col gap-2">
                           <Video className="h-6 w-6" />
                           Programar Clases
                         </Button>
                         <Button variant="outline" className="h-24 flex flex-col gap-2">
                           <Settings className="h-6 w-6" />
                           Configuración
                         </Button>
                       </CardContent>
                     </Card>
         
                     {/* Recent Activity - CON DATOS REALES */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                       {/* Usuarios Recientes */}
                       <Card>
                         <CardHeader>
                           <CardTitle>Usuarios Recientes</CardTitle>
                           <CardDescription>Últimos usuarios registrados</CardDescription>
                         </CardHeader>
                         <CardContent>
                           <div className="space-y-4">
                             {estadisticas?.recientes?.usuarios?.slice(0, 5).map((usuario: any) => (
                               <div key={usuario.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                   {usuario.nombres?.charAt(0) || 'U'}
                                 </div>
                                 <div className="flex-1">
                                   <p className="font-medium">{usuario.nombres} {usuario.apellidos}</p>
                                   <p className="text-sm text-gray-500">{usuario.email}</p>
                                   <span className={`text-xs px-2 py-1 mt-1 rounded ${
                                     usuario.tipoUsuario === 'administrador' 
                                       ? 'bg-red-100 text-red-700' 
                                       : usuario.tipoUsuario === 'profesor'
                                       ? 'bg-purple-100 text-purple-700'
                                       : 'bg-blue-100 text-blue-700'
                                   }`}>
                                     {usuario.tipoUsuario}
                                   </span>
                                 </div>
                                 <span className="text-xs text-gray-400">
                                   {new Date(usuario.fechaRegistro).toLocaleDateString()}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </CardContent>
                       </Card>
         
                       {/* Pagos Recientes */}
                       <Card>
                         <CardHeader>
                           <CardTitle>Pagos Recientes</CardTitle>
                           <CardDescription>Últimas transacciones</CardDescription>
                         </CardHeader>
                         <CardContent>
                           <div className="space-y-4">
                             {estadisticas?.recientes?.pagos?.slice(0, 5).map((pago: any) => (
                               <div key={pago.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                   pago.estado === 'completado' 
                                     ? 'bg-green-100 text-green-600' 
                                     : pago.estado === 'pendiente_validacion'
                                     ? 'bg-yellow-100 text-yellow-600'
                                     : 'bg-red-100 text-red-600'
                                 }`}>
                                   <DollarSign className="h-4 w-4" />
                                 </div>
                                 <div className="flex-1">
                                   <p className="font-medium">S/ {pago.monto}</p>
                                   <p className="text-sm text-gray-500">
                                     {pago.tipoPago === 'matricula' ? 'Matrícula' : 'Curso'} • {pago.usuario.nombres}
                                   </p>
                                   <span className={`text-xs px-2 py-1 mt-1 rounded ${
                                     pago.estado === 'completado' 
                                       ? 'bg-green-100 text-green-700' 
                                       : pago.estado === 'pendiente_validacion'
                                       ? 'bg-yellow-100 text-yellow-700'
                                       : 'bg-red-100 text-red-700'
                                   }`}>
                                     {pago.estado}
                                   </span>
                                 </div>
                                 <span className="text-xs text-gray-400">
                                   {new Date(pago.fechaPago).toLocaleDateString()}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </CardContent>
                       </Card>
                     </div>
         
                     {/* Cursos Recientes */}
                     <Card className="mt-6">
                       <CardHeader>
                         <CardTitle>Cursos Recientes</CardTitle>
                         <CardDescription>Últimos cursos creados</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {estadisticas?.recientes?.cursos?.slice(0, 4).map((curso: any) => (
                             <div key={curso.id} className="p-4 border rounded-lg">
                               <div className="flex items-center gap-3 mb-2">
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                   {curso.nombre?.charAt(0) || 'C'}
                                 </div>
                                 <div>
                                   <p className="font-medium">{curso.nombre}</p>
                                   <p className="text-sm text-gray-500">{curso.codigoCurso}</p>
                                 </div>
                               </div>
                               <div className="flex justify-between items-center mt-3">
                                 <span className={`text-xs px-2 py-1 rounded ${
                                   curso.activo 
                                     ? 'bg-green-100 text-green-700' 
                                     : 'bg-gray-100 text-gray-700'
                                 }`}>
                                   {curso.activo ? 'Activo' : 'Inactivo'}
                                 </span>
                                 <span className="text-xs text-gray-400">
                                   {new Date(curso.fechaCreacion).toLocaleDateString()}
                                 </span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                   </TabsContent>

          {/* Cursos Tab - CORREGIDO */}
          <TabsContent value="cursos">
            <div className="space-y-6">
              {/* Crear Curso (mantener igual) */}
             <TabsContent value="cursos">
                         <div className="space-y-6">
                  {/* Botón para abrir modal de creación de curso */}
                 
                    <CardHeader>
                      <div className="flex justify-between items-center w-full">
                        <div>
                          
                          <CardTitle>Gestión de Cursos</CardTitle>
                          <CardDescription>Administra todos los cursos del sistema</CardDescription>
                          <br />
                          <Button onClick={abrirModalCrearCurso}>
                          <Plus className="h-4 w-4 mr-1" />
                          Crear Nuevo Curso
                        </Button>
                        </div>
                        
                      </div>
                    </CardHeader>
                 
                  
                  {/* Resto del contenido de la pestaña de cursos... */}
                </div>
                       </TabsContent>

              {/* Lista de Cursos y Gestión */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Cursos */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Cursos Registrados</CardTitle>
                    <CardDescription>{cursos.length} cursos en total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {Array.isArray(cursos) && cursos.length > 0 ? (
                        cursos.map((curso: Curso) => (
                          <div 
                            key={curso.id} 
                            className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                              cursoSeleccionado === curso.id ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleSeleccionarCurso(curso.id)}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{curso.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {curso.codigoCurso} - S/ {curso.precio}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  curso.activo 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {curso.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {curso.totalUnidades || 0} unidades
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalEditarCurso(curso);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCurso(curso.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">No hay cursos registrados</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Gestión de Unidades y Clases Zoom */}
                <div className="lg:col-span-2 space-y-6">
                  {cursoSeleccionado ? (
                    <>
                      {/* Unidades del Curso */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Unidades del Curso</CardTitle>
                          <CardDescription>Gestiona las unidades del curso seleccionado</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="mb-4" onClick={abrirDialogoUnidad}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Unidad
                          </Button>

                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Crear Nueva Unidad</DialogTitle>
                                <DialogDescription>
                                  Añade una nueva unidad al curso seleccionado.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="numero-unidad">Número de Unidad</Label>
                                    <Input
                                      id="numero-unidad"
                                      type="number"
                                      value={unidadForm.numeroUnidad}
                                      onChange={(e) => setUnidadForm({...unidadForm, numeroUnidad: e.target.value})}
                                      placeholder="1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="orden-unidad">Orden</Label>
                                    <Input
                                      id="orden-unidad"
                                      type="number"
                                      value={unidadForm.orden}
                                      onChange={(e) => setUnidadForm({...unidadForm, orden: e.target.value})}
                                      placeholder="1"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="titulo-unidad">Título *</Label>
                                  <Input
                                    id="titulo-unidad"
                                    value={unidadForm.titulo}
                                    onChange={(e) => setUnidadForm({...unidadForm, titulo: e.target.value})}
                                    placeholder="Ej: Introducción al Marketing"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="descripcion-unidad">Descripción</Label>
                                  <Textarea
                                    id="descripcion-unidad"
                                    value={unidadForm.descripcion}
                                    onChange={(e) => setUnidadForm({...unidadForm, descripcion: e.target.value})}
                                    placeholder="Descripción de la unidad"
                                    rows={3}
                                  />
                                </div>
                                <input
                                  type="hidden"
                                  value={cursoSeleccionado}
                                  readOnly
                                />
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={handleCreateUnidad}
                                  disabled={loading}
                                >
                                  {loading ? 'Creando...' : 'Crear Unidad'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>


                          <Dialog open={isAsignarProfesorDialogOpen} onOpenChange={setIsAsignarProfesorDialogOpen}>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Asignar Profesor al Curso</DialogTitle>
                              <DialogDescription>
                                Selecciona un profesor para asignar al curso seleccionado.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div>
                                <Label htmlFor="profesor-select">Profesor *</Label>
                                <Select
                                  value={asignarProfesorForm.profesorId.toString()}
                                  onValueChange={(value) => setAsignarProfesorForm({
                                    ...asignarProfesorForm, 
                                    profesorId: parseInt(value)
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un profesor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {profesores.length > 0 ? (
                                      profesores.map((profesor) => (
                                        <SelectItem key={profesor.id} value={profesor.id.toString()}>
                                          {profesor.nombres} {profesor.apellidos} - {profesor.email}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="0" disabled>No hay profesores disponibles</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="es-principal"
                                  checked={asignarProfesorForm.esPrincipal}
                                  onChange={(e) => setAsignarProfesorForm({
                                    ...asignarProfesorForm,
                                    esPrincipal: e.target.checked
                                  })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="es-principal" className="text-sm font-normal">
                                  Marcar como profesor principal
                                </Label>
                              </div>
                              <div className="text-sm text-gray-500">
                                <p>Curso seleccionado: <strong>{cursos.find(c => c.id === cursoSeleccionado)?.nombre}</strong></p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline"
                                onClick={() => setIsAsignarProfesorDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                onClick={handleAsignarProfesor}
                                disabled={loading}
                              >
                                {loading ? 'Asignando...' : 'Asignar Profesor'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {unidades.length > 0 ? (
                              unidades.map((unidad: Unidad) => (
                                <div 
                                  key={unidad.id} 
                                  className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                                    unidadSeleccionada === unidad.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleSeleccionarUnidad(unidad.id)}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Layers className="h-4 w-4 text-gray-400" />
                                      <div>
                                        <p className="font-medium">
                                          Unidad {unidad.numeroUnidad}: {unidad.titulo}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {unidad.descripcion || 'Sin descripción'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                        Orden: {unidad.orden}
                                      </span>
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                        {unidad.contenido?.length || 0} contenidos
                                      </span>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSeleccionarUnidad(unidad.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-gray-500 py-4">
                                No hay unidades en este curso. ¡Agrega la primera!
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Clases Zoom Programadas */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Clases Zoom Programadas</CardTitle>
                          <CardDescription>Gestiona las clases en vivo del curso</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="mb-4" onClick={abrirDialogoClaseZoom}>
                            <Video className="h-4 w-4 mr-2" />
                            Programar Clase Zoom
                          </Button>
                      
                          <Dialog open={isClaseDialogOpen} onOpenChange={setIsClaseDialogOpen}>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Programar Nueva Clase Zoom</DialogTitle>
                                <DialogDescription>
                                  Programa una clase en vivo para el curso seleccionado.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <Label htmlFor="titulo-clase">Título de la Clase *</Label>
                                  <Input
                                    id="titulo-clase"
                                    value={claseZoomForm.titulo}
                                    onChange={(e) => setClaseZoomForm({...claseZoomForm, titulo: e.target.value})}
                                    placeholder="Ej: Clase sobre Marketing Digital"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="descripcion-clase">Descripción</Label>
                                  <Textarea
                                    id="descripcion-clase"
                                    value={claseZoomForm.descripcion}
                                    onChange={(e) => setClaseZoomForm({...claseZoomForm, descripcion: e.target.value})}
                                    placeholder="Descripción de la clase"
                                    rows={3}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="fecha-inicio">Fecha y Hora Inicio *</Label>
                                    <Input
                                      id="fecha-inicio"
                                      type="datetime-local"
                                      value={claseZoomForm.fechaHoraInicio}
                                      onChange={(e) => setClaseZoomForm({...claseZoomForm, fechaHoraInicio: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="fecha-fin">Fecha y Hora Fin</Label>
                                    <Input
                                      id="fecha-fin"
                                      type="datetime-local"
                                      value={claseZoomForm.fechaHoraFin}
                                      onChange={(e) => setClaseZoomForm({...claseZoomForm, fechaHoraFin: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="url-zoom">URL de Zoom *</Label>
                                  <Input
                                    id="url-zoom"
                                    value={claseZoomForm.urlZoom}
                                    onChange={(e) => setClaseZoomForm({...claseZoomForm, urlZoom: e.target.value})}
                                    placeholder="https://zoom.us/j/123456789"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="password-zoom">Contraseña de Zoom (opcional)</Label>
                                  <Input
                                    id="password-zoom"
                                    type="password"
                                    value={claseZoomForm.passwordZoom}
                                    onChange={(e) => setClaseZoomForm({...claseZoomForm, passwordZoom: e.target.value})}
                                    placeholder="clase123"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="unidad-clase">Asociar a Unidad (opcional)</Label>
                                  <Select
                                    value={claseZoomForm.unidadId.toString()}
                                    onValueChange={(value) => setClaseZoomForm({...claseZoomForm, unidadId: parseInt(value)})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona una unidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">No asociar a unidad</SelectItem>
                                      {unidades.map((unidad) => (
                                        <SelectItem key={unidad.id} value={unidad.id.toString()}>
                                          Unidad {unidad.numeroUnidad}: {unidad.titulo}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <input
                                  type="hidden"
                                  value={cursoSeleccionado}
                                  readOnly
                                />
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={handleCreateClaseZoom}
                                  disabled={loading}
                                >
                                  {loading ? 'Programando...' : 'Programar Clase'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {clasesZoom.length > 0 ? (
                              clasesZoom.map((clase: ClaseZoom) => (
                                <div key={clase.id} className="p-3 border rounded">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4 text-blue-500" />
                                        <p className="font-medium">{clase.titulo}</p>
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {clase.descripcion}
                                      </p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <div className="text-sm">
                                          <span className="font-medium">Inicio:</span>{' '}
                                          {formatearFecha(clase.fechaHoraInicio)}
                                        </div>
                                        <div className="text-sm">
                                          <span className="font-medium">Fin:</span>{' '}
                                          {formatearFecha(clase.fechaHoraFin)}
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      clase.estado === 'programada' 
                                        ? 'bg-yellow-100 text-yellow-700' 
                                        : clase.estado === 'en_progreso'
                                        ? 'bg-blue-100 text-blue-700'
                                        : clase.estado === 'finalizada'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {clase.estado}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" asChild>
                                      <a 
                                        href={clase.urlZoom} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <Link className="h-4 w-4 mr-1" />
                                        Unirse
                                      </a>
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-gray-500 py-4">
                                No hay clases Zoom programadas para este curso.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      {/* Mostrar profesores asignados - CORREGIDO */}
{cursoSeleccionado && (() => {
  const cursoActual = cursos.find(c => c.id === cursoSeleccionado);
  return cursoActual ? (
    <Card>
      <CardHeader>
        <CardTitle>Profesores Asignados</CardTitle>
        <CardDescription>Lista de profesores del curso</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" onClick={abrirDialogoAsignarProfesor}>
  <UserCheck className="h-4 w-4 mr-2" />
  Asignar Profesor
</Button>
        <div className="space-y-3">
          {cursoActual.profesores && cursoActual.profesores.length > 0 ? (
            cursoActual.profesores.map((asignacion: any) => (
              <div key={asignacion.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {asignacion.profesor.nombres} {asignacion.profesor.apellidos}
                    </p>
                    <p className="text-sm text-gray-500">
                      {asignacion.profesor.email}
                    </p>
                  </div>
                </div>
                {asignacion.esPrincipal && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    Principal
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              No hay profesores asignados a este curso
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  ) : null;
})()}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Selecciona un curso para gestionar sus unidades y clases</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Nueva Tab: Contenido - CORREGIDO */}
          <TabsContent value="contenido">
            <div className="space-y-6">
              {/* Subir Contenido */}
              <Card>
                <CardHeader>
                  <CardTitle>Subir Contenido</CardTitle>
                  <CardDescription>Agrega contenido a las unidades de los cursos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="curso-contenido">Seleccionar Curso *</Label>
                        <Select
                          value={cursoSeleccionado?.toString() || ''}
                          onValueChange={(value) => handleSeleccionarCurso(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos.map((curso) => (
                              <SelectItem key={curso.id} value={curso.id.toString()}>
                                {curso.nombre} ({curso.codigoCurso})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="unidad-contenido">Seleccionar Unidad *</Label>
                        <Select
                          value={unidadSeleccionada?.toString() || ''}
                          onValueChange={(value) => handleSeleccionarUnidad(parseInt(value))}
                          disabled={!cursoSeleccionado}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={cursoSeleccionado ? "Selecciona una unidad" : "Primero selecciona un curso"} />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((unidad) => (
                              <SelectItem key={unidad.id} value={unidad.id.toString()}>
                                Unidad {unidad.numeroUnidad}: {unidad.titulo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {unidadSeleccionada ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="titulo-contenido">Título del Contenido *</Label>
                            <Input
                              id="titulo-contenido"
                              value={contenidoForm.titulo}
                              onChange={(e) => setContenidoForm({...contenidoForm, titulo: e.target.value})}
                              placeholder="Ej: Video de introducción"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="tipo-contenido">Tipo de Contenido *</Label>
                            <Select
                              value={contenidoForm.tipoContenido}
                              onValueChange={(value: any) => setContenidoForm({...contenidoForm, tipoContenido: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video_zoom">Video Zoom</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="diapositiva">Diapositiva</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                                <SelectItem value="enlace">Enlace</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="descripcion-contenido">Descripción</Label>
                          <Textarea
                            id="descripcion-contenido"
                            value={contenidoForm.descripcion}
                            onChange={(e) => setContenidoForm({...contenidoForm, descripcion: e.target.value})}
                            placeholder="Descripción del contenido"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="orden-contenido">Orden</Label>
                            <Input
                              id="orden-contenido"
                              type="number"
                              value={contenidoForm.orden}
                              onChange={(e) => setContenidoForm({...contenidoForm, orden: e.target.value})}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duracion-contenido">Duración (minutos)</Label>
                            <Input
                              id="duracion-contenido"
                              type="number"
                              value={contenidoForm.duracionMinutos}
                              onChange={(e) => setContenidoForm({...contenidoForm, duracionMinutos: e.target.value})}
                              placeholder="15"
                            />
                          </div>
                          <div>
                            <Label htmlFor="url-contenido">
                              {contenidoForm.tipoContenido === 'enlace' ? 'URL *' : 'URL (opcional)'}
                            </Label>
                            <Input
                              id="url-contenido"
                              value={contenidoForm.urlArchivo}
                              onChange={(e) => setContenidoForm({...contenidoForm, urlArchivo: e.target.value})}
                              placeholder="https://ejemplo.com/contenido"
                              required={contenidoForm.tipoContenido === 'enlace'}
                            />
                          </div>
                        </div>

                        {contenidoForm.tipoContenido !== 'enlace' && (
                          <div>
                            <Label htmlFor="archivo-contenido">Subir Archivo *</Label>
                            <div className="mt-1 flex items-center gap-4">
                              <Input
                                id="archivo-contenido"
                                type="file"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                                required
                              />
                              {archivoSeleccionado && (
                                <span className="text-sm text-gray-600">
                                  {archivoSeleccionado.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Tipos permitidos: video, pdf, presentación, documento
                            </p>
                          </div>
                        )}

                        <Button 
                          onClick={handleUploadContenido} 
                          className="w-full" 
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {loading ? 'Subiendo...' : 'Subir Contenido'}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {cursoSeleccionado 
                            ? 'Selecciona una unidad para subir contenido' 
                            : 'Selecciona un curso y una unidad para comenzar'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Contenido */}
              {unidadSeleccionada && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido de la Unidad</CardTitle>
                    <CardDescription>
                      {unidades.find(u => u.id === unidadSeleccionada)?.titulo || 'Unidad seleccionada'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contenidos.length > 0 ? (
                        contenidos.map((contenido: Contenido) => (
                          <div key={contenido.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getIconoTipoContenido(contenido.tipoContenido)}
                                <div>
                                  <p className="font-medium">{contenido.titulo}</p>
                                  <p className="text-sm text-gray-500">
                                    {contenido.descripcion}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                      Orden: {contenido.orden}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {contenido.tipoContenido}
                                    </span>
                                    {contenido.duracionMinutos && (
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                        {contenido.duracionMinutos} min
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                      {new Date(contenido.fechaSubida).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {contenido.urlArchivo && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a 
                                      href={contenido.urlArchivo} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      {contenido.tipoContenido === 'enlace' ? (
                                        <Globe className="h-4 w-4 mr-1" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      {contenido.tipoContenido === 'enlace' ? 'Abrir' : 'Descargar'}
                                    </a>
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No hay contenido en esta unidad</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Sube el primer contenido usando el formulario superior
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Usuarios Tab (mantener igual) */}
          <TabsContent value="usuarios">
                      <Card>
                        <CardHeader>
                          <CardTitle>Gestión de Usuarios</CardTitle>
                          <CardDescription>Administra estudiantes y profesores</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Buscar usuario por nombre o DNI..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredUsuarios.length > 0 ? (
                              filteredUsuarios.map((usuario: Usuario) => (
                                <div key={usuario.id} className="flex items-center justify-between p-4 border rounded">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                      {usuario.nombres?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <p className="font-medium">{usuario.nombres} {usuario.apellidos}</p>
                                      <p className="text-sm text-gray-500">{usuario.email}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          usuario.tipoUsuario === 'administrador' 
                                            ? 'bg-red-100 text-red-700' 
                                            : usuario.tipoUsuario === 'profesor'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {usuario.tipoUsuario}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          usuario.estado === 'activo' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {usuario.estado}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">Ver Perfil</Button>
                                    <Button size="sm" variant="outline">Editar</Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-gray-500 py-8">
                                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

          {/* Pagos Tab (mantener igual) */}
           <TabsContent value="pagos">
                      <Card>
                        <CardHeader>
                          <CardTitle>Pagos Pendientes de Confirmación</CardTitle>
                          <CardDescription>
                            {pagos.length} pagos requieren tu atención
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Array.isArray(pagos) && pagos.length > 0 ? (
                              pagos.map((pago: Pago) => (
                                <div key={pago.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-medium">
                                        {pago.usuario?.nombres || 'Usuario'} {pago.usuario?.apellidos || ''}
                                      </p>
                                      <p className="text-sm text-gray-500">{pago.usuario?.email || 'Email no disponible'}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                          {pago.codigoTransaccion || 'Sin código'}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                          {pago.tipoPago === 'matricula' ? 'Matrícula' : 'Curso'}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                          {pago.metodoPago === 'yape' ? 'Yape' : pago.metodoPago === 'tarjeta' ? 'Transferencia' : 'Stripe'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Fecha: {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : 'Fecha no disponible'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">
                                        S/ {pago.monto ? Number(pago.monto).toFixed(2) : '0.00'}
                                      </p>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        pago.estado === 'pendiente_validacion' 
                                          ? 'bg-yellow-100 text-yellow-700' 
                                          : pago.estado === 'completado'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {pago.estado || 'Desconocido'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {pago.referenciaExterna && (
                                    <div className="mb-3">
                                      <p className="text-sm">
                                        <span className="font-medium">Referencia:</span> {pago.referenciaExterna}
                                      </p>
                                    </div>
                                  )}
          
                                  <div className="border-t pt-3 mt-3">
                                    <div className="flex gap-2">
                                      {pago.estado === 'pendiente_validacion' && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleConfirmarPago(pago.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Confirmar
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleRechazarPago(pago.id)}
                                            className="flex-1"
                                          >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Rechazar
                                          </Button>
                                        </>
                                      )}
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleVerDetallesPago(pago)}
                                        className="flex-1"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Detalles
                                      </Button>
                                    </div>
                                    
                                    {pago.detallesPago && pago.estado === 'fallido' && (
                                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm text-red-700">
                                          <AlertCircle className="h-4 w-4 inline mr-1" />
                                          <span className="font-medium">Motivo del rechazo:</span> {pago.detallesPago.razon}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                <p className="text-gray-500">No hay pagos pendientes</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Total de pagos completados: {estadisticas?.conteos?.pagos || 0}
                                </p>
                                <Button 
                                  onClick={loadPagosPendientes} 
                                  variant="outline" 
                                  className="mt-4"
                                >
                                  Reintentar carga
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
        </Tabs>

        {/* Modal para Detalles de Pago */}
<Dialog open={isDetallesPagoOpen} onOpenChange={setIsDetallesPagoOpen}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Detalles del Pago</DialogTitle>
      <DialogDescription>
        Información completa de la transacción
      </DialogDescription>
    </DialogHeader>
    
    {pagoDetalle && (
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Código de Transacción</Label>
            <p className="mt-1 text-sm">{pagoDetalle.codigoTransaccion}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Tipo de Pago</Label>
            <p className="mt-1 text-sm">
              {pagoDetalle.tipoPago === 'matricula' ? 'Matrícula' : 'Curso'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Método de Pago</Label>
            <p className="mt-1 text-sm">
              {pagoDetalle.metodoPago === 'yape' 
                ? 'Yape' 
                : pagoDetalle.metodoPago === 'tarjeta' 
                ? 'Transferencia' 
                : 'Stripe'}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Monto</Label>
            <p className="mt-1 text-lg font-bold text-green-600">
              S/ {typeof pagoDetalle.monto === 'number' 
                ? pagoDetalle.monto.toFixed(2) 
                : parseFloat(pagoDetalle.monto || '0').toFixed(2)}
            </p>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-500">Estado</Label>
          <span className={`mt-1 inline-block px-2 py-1 text-xs rounded ${
            pagoDetalle.estado === 'pendiente_validacion' 
              ? 'bg-yellow-100 text-yellow-700' 
              : pagoDetalle.estado === 'completado'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {pagoDetalle.estado}
          </span>
        </div>
        
        {pagoDetalle.referenciaExterna && (
          <div>
            <Label className="text-sm font-medium text-gray-500">Referencia Externa</Label>
            <p className="mt-1 text-sm">{pagoDetalle.referenciaExterna}</p>
          </div>
        )}
        
        <div>
          <Label className="text-sm font-medium text-gray-500">Fecha</Label>
          <p className="mt-1 text-sm">
            {new Date(pagoDetalle.fechaPago).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-500">Usuario</Label>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="font-medium">
              {pagoDetalle.usuario?.nombres || 'N/A'} {pagoDetalle.usuario?.apellidos || ''}
            </p>
            <p className="text-sm text-gray-500">{pagoDetalle.usuario?.email || 'N/A'}</p>
            <p className="text-sm text-gray-500">DNI: {pagoDetalle.usuario?.dni || 'N/A'}</p>
            <p className="text-sm text-gray-500">Teléfono: {pagoDetalle.usuario?.telefono || 'N/A'}</p>
          </div>
        </div>
        
        {/* Mostrar imagen del comprobante */}
        <div>
          <Label className="text-sm font-medium text-gray-500">Comprobante de Pago</Label>
          <div className="mt-2">
            {pagoDetalle.comprobanteUrl ? (
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Imagen del comprobante:</p>
                  <a 
                    href={pagoDetalle.comprobanteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir en nueva pestaña
                  </a>
                </div>
                <div className="relative h-64 border rounded overflow-hidden bg-gray-100">
                  <img 
                    src={pagoDetalle.comprobanteUrl} 
                    alt="Comprobante de pago" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
                    }}
                  />
                  <button 
                    onClick={() => {
                      window.open(pagoDetalle.comprobanteUrl, '_blank');
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white"
                    title="Ver imagen completa"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(pagoDetalle.comprobanteUrl, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver imagen completa
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Descargar la imagen
                      const link = document.createElement('a');
                      link.href = pagoDetalle.comprobanteUrl || '';
                      link.download = `comprobante-${pagoDetalle.codigoTransaccion}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay comprobante disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  El usuario no ha subido imagen de comprobante
                </p>
              </div>
            )}
          </div>
        </div>
        
        {pagoDetalle.detallesPago?.razonRechazo && pagoDetalle.estado === 'fallido' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <Label className="text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Motivo del rechazo:
            </Label>
            <p className="mt-1 text-sm text-red-700">{pagoDetalle.detallesPago.razonRechazo}</p>
          </div>
        )}
      </div>
    )}
    
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => setIsDetallesPagoOpen(false)}
      >
        Cerrar
      </Button>
      {pagoDetalle?.estado === 'pendiente_validacion' && (
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              handleConfirmarPago(pagoDetalle.id);
              setIsDetallesPagoOpen(false);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirmar Pago
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const razonRechazo = prompt('Motivo del rechazo:');
              if (razonRechazo) {
                // Lógica para rechazar desde el modal
                handleRechazarPago(pagoDetalle.id);
                setIsDetallesPagoOpen(false);
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rechazar
          </Button>
        </div>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </div>

    
  );
  
};

export default AdminDashboard;