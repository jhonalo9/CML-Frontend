'use client'
import Link from 'next/link';


export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            ML
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center">Recuperar Contraseña</h1>
        <p className="text-gray-600 mb-6 text-center">
          Próximamente podrás recuperar tu contraseña aquí
        </p>
        <a href="/auth/login" className="text-purple-600 hover:underline block text-center">
          ← Volver al login
        </a>
      </div>
    </div>
  );
}