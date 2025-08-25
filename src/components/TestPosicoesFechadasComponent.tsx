import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from "lucide-react";
import { TestPosicoesFechadasService } from "@/lib/testPosicoesFechadasService";

export const TestPosicoesFechadasComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      // Teste de conexão
      const connectionTest = await TestPosicoesFechadasService.testConnection();
      
      // Teste do banco
      const databaseTest = await TestPosicoesFechadasService.testDirectDatabase();
      
      setTestResults({
        connection: connectionTest,
        database: databaseTest
      });
    } catch (error) {
      setTestResults({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Teste de Posições Fechadas
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando Testes...
            </>
          ) : (
            'Executar Testes de Diagnóstico'
          )}
        </Button>

        {testResults && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Resultados dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🔗 Teste de Conexão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={testResults.connection?.success ? 'text-green-600' : 'text-red-600'}>
                        {testResults.connection?.success ? '✅ Sucesso' : '❌ Falha'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessão:</span>
                      <span className={testResults.connection?.sessionValid ? 'text-green-600' : 'text-red-600'}>
                        {testResults.connection?.sessionValid ? '✅ Válida' : '❌ Inválida'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token:</span>
                      <span className={testResults.connection?.tokenPresent ? 'text-green-600' : 'text-red-600'}>
                        {testResults.connection?.tokenPresent ? '✅ Presente' : '❌ Ausente'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🗄️ Teste do Banco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={testResults.database?.success ? 'text-green-600' : 'text-red-600'}>
                        {testResults.database?.success ? '✅ Sucesso' : '❌ Falha'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vagas Encontradas:</span>
                      <span className="text-blue-600">
                        {testResults.database?.data?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 