// Usuario
export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  tipoUsuario: 'estudiante' | 'profesor' | 'administrador';
  fotoPerfil?: string;
  dni: string;
  telefono?: string;
  ciudad: string;
  pais: string;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  sexo: 'Masculino' | 'Femenino';
  dni: string;
  edad: number;
  fechaNacimiento: string;
  direccion: string;
  ciudad: string;
  pais: string;
  distritoPertenece: string;
  ocupacion?: string;
  profesion?: string;
  nivelEstudios: 'Primaria' | 'Secundaria' | 'Superior';
  esMiembroPlenaComunion: boolean;
  nombreIglesia: string;
  nombrePastor: string;
  telefono?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

// Curso
export interface Curso {
  id: number;
  codigoCurso: string;
  nombre: string;
  descripcion?: string;
  numeroOrden: number;
  precio: number;
  imagenPortada?: string;
  totalUnidades: number;
  totalEvaluaciones: number;
  activo: boolean;
  profesores?: ProfesorCurso[];
}

export interface ProfesorCurso {
  profesor: {
    nombres: string;
    apellidos: string;
    fotoPerfil?: string;
  };
}

// Matrícula
export interface Matricula {
  id: number;
  codigoMatricula: string;
  montoMatricula: number;
  estadoPago: 'pendiente' | 'pagado' | 'cancelado';
  fechaMatricula: string;
  activa: boolean;
}

// Inscripción
export interface InscripcionCurso {
  id: number;
  cursoId: number;
  curso: Curso;
  montoCurso: number;
  estadoPago: 'pendiente' | 'pagado' | 'cancelado';
  estadoCurso: 'no_iniciado' | 'en_progreso' | 'completado' | 'reprobado';
  progresoPorcentaje: number;
  calificacionFinal?: number;
  aprobado: boolean;
  fechaInscripcion: string;
}

// Contenido
export interface Contenido {
  id: number;
  titulo: string;
  descripcion?: string;
  tipoContenido: 'pdf' | 'video_zoom' | 'diapositiva' | 'otro';
  urlArchivo: string;
  tamanoMb?: number;
  duracionMinutos?: number;
  orden: number;
  activo: boolean;
}

// Evaluación
export interface Evaluacion {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'evaluacion_unidad' | 'examen_final';
  puntuacionMaxima: number;
  puntuacionMinimaAprobacion: number;
  duracionMinutos: number;
  intentosPermitidos: number;
  fechaDisponible?: string;
  fechaCierre?: string;
}

export interface PreguntaEvaluacion {
  id: number;
  pregunta: string;
  tipoPregunta: 'multiple_choice' | 'verdadero_falso' | 'desarrollo' | 'completar';
  opciones?: any;
  puntos: number;
  orden: number;
}

// Clase Zoom
export interface ClaseZoom {
  id: number;
  titulo: string;
  descripcion?: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  urlZoom: string;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  curso: {
    nombre: string;
  };
}

// Notificación
export interface Notificacion {
  id: number;
  tipo: 'pago' | 'curso' | 'evaluacion' | 'clase_zoom' | 'sistema';
  titulo: string;
  mensaje?: string;
  urlAccion?: string;
  leida: boolean;
  fechaCreacion: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}


export interface NotasResponse {
  notas: Nota[];
  estadisticas: EstadisticasNotas;
  resultadosCompletos?: ResultadoEvaluacion[];
}

export interface ResultadoEvaluacion {
  id: number;
  inscripcionCursoId: number;
  evaluacionId: number;
  intentoNumero: number;
  puntuacionObtenida: number | null;
  porcentaje: number | null;
  aprobado: boolean | null;
  respuestas: any; // JSON
  fechaInicio: string;
  fechaFinalizacion: string | null;
  tiempoEmpleadoMinutos: number | null;
  calificado: boolean;
  calificadoPorId: number | null;
  fechaCalificacion: string | null;
  retroalimentacionProfesor: string | null;
  
  // Relaciones (opcionales, según lo que incluyas en la query)
 
}

export interface Nota {
  id: number;
  evaluacion: string;
  tipo: string;
  unidad: string;
  puntajeMaximo: number;
  puntajeObtenido: number | null;
  porcentaje: number | null;
  aprobado: boolean | null;
  estado: 'calificado' | 'pendiente' | 'no_realizada';
  intento: number;
  fecha: string | null;
  calificadoPor: string | null;
  retroalimentacion: string | null;
}

export interface EstadisticasNotas {
  totalEvaluaciones: number;
  evaluacionesRealizadas: number;
  evaluacionesPendientes: number;
  promedio: number;
  puntajeMaximo: number;
  puntajeMinimo: number;
  aprobadas: number;
  desaprobadas: number;
  tasaAprobacion: number;
}