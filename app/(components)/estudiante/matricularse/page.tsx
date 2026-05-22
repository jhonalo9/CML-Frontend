'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/app/src/lib/api/client'; // Importa tu apiClient

export default function MatricularsePage() {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usa apiClient en lugar de fetch
      const response = await apiClient.post('/matriculas/crear', {
        respuestasAdicionales: respuestas
      });

      if (response.data.success) {
        router.push(`/estudiante/pagar-matricula/${response.data.data.id}`);
      } else {
        setError(response.data.message || 'Error al crear matrícula');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Completar Matrícula</CardTitle>
          <CardDescription>
            Completa el siguiente formulario para matricularte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="respuestas">
                ¿Por qué deseas estudiar en nuestro programa?
              </Label>
              <Textarea
                id="respuestas"
                value={respuestas}
                onChange={(e) => setRespuestas(e.target.value)}
                placeholder="Comparte tus motivaciones..."
                required
                rows={5}
              />
              <p className="text-sm text-gray-500">
                Esta información nos ayudará a conocerte mejor
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> El costo de la matrícula es de $50.00.
                Después de completar este formulario, serás redirigido a la página de pago.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-1/3"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="w-2/3"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Continuar al Pago ($50.00)'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}