// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren matrícula pagada
const RUTAS_REQUIEREN_MATRICULA = [
  '/dashboard',
  '/estudiante/cursos',
  '/estudiante/mis-cursos',
  '/estudiante/cursos-disponibles',
];

// Rutas que NO deben ser bloqueadas (públicas)
const RUTAS_PERMITIDAS = [
  '/auth/login',
  '/auth/register',
  '/estudiante/pagar-matricula',
  '/estudiante/pago-manual',
  '/estudiante/pago-en-revision',
  '/estudiante/pago-exitoso',
  '/api',
  '/_next',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir rutas públicas
  if (RUTAS_PERMITIDAS.some(ruta => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }
  
  // Verificar si la ruta requiere matrícula
  const requiereMatricula = RUTAS_REQUIEREN_MATRICULA.some(ruta => 
    pathname.startsWith(ruta)
  );
  
  if (!requiereMatricula) {
    return NextResponse.next();
  }
  
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Si no hay token, redirigir al login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar estado de matrícula
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matriculas/mi-matricula`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data?.matricula) {
        const matricula = data.data.matricula;
        
        // Caso 1: Sin matrícula activa
        if (!matricula.activa) {
          const matriculaUrl = new URL('/estudiante/pagar-matricula', request.url);
          return NextResponse.redirect(matriculaUrl);
        }
        
        // Caso 2: Matrícula pendiente de pago
        if (matricula.estadoPago === 'pendiente') {
          const revisionUrl = new URL('/estudiante/pago-en-revision', request.url);
          revisionUrl.searchParams.set('tipo', 'matricula');
          revisionUrl.searchParams.set('referencia', matricula.codigoMatricula);
          revisionUrl.searchParams.set('monto', matricula.montoMatricula);
          return NextResponse.redirect(revisionUrl);
        }
        
        // Caso 3: Matrícula pagada - permitir acceso
        if (matricula.estadoPago === 'pagado') {
          return NextResponse.next();
        }
      }
    }
    
    // Si hay error o no hay matrícula, redirigir a pagar matrícula
    const matriculaUrl = new URL('/estudiante/pagar-matricula', request.url);
    return NextResponse.redirect(matriculaUrl);
    
  } catch (error) {
    console.error('Error en middleware:', error);
    
    // En caso de error, redirigir a login
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/estudiante/:path*',
    // Excluir rutas públicas
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/register).*)',
  ],
};