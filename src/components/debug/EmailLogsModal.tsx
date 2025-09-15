import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Mail, Clock } from 'lucide-react';
import { useEmailFallback, EmailFallbackLog } from '@/lib/emailFallback';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailLogsModal({ isOpen, onClose }: EmailLogsModalProps) {
  const { getLogs, clearLogs } = useEmailFallback();
  const logs = getLogs();

  const handleClearLogs = () => {
    clearLogs();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Logs de Emails Simulados
          </DialogTitle>
          <DialogDescription>
            Emails que foram simulados durante desenvolvimento (conta Brevo não ativada)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header com ações */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {logs.length} email{logs.length !== 1 ? 's' : ''} simulado{logs.length !== 1 ? 's' : ''}
            </p>
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Logs
              </Button>
            )}
          </div>

          {/* Lista de logs */}
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum email simulado ainda</p>
              <p className="text-sm">Os emails simulados aparecerão aqui quando a conta Brevo não estiver ativada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{log.subject}</span>
                        <Badge variant="secondary" className="text-xs">
                          {log.template}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Para:</span>
                          <span>{log.to}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={log.status === 'simulated' ? 'default' : 'destructive'}
                      className="ml-4"
                    >
                      {log.status === 'simulated' ? '📧 Simulado' : '❌ Falhou'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informações sobre ativação da conta */}
          {logs.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                💡 Como ativar a conta Brevo
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. Entre em contato com <strong>contact@brevo.com</strong></p>
                <p>2. Solicite a ativação da conta SMTP</p>
                <p>3. Aguarde confirmação (geralmente 24-48h)</p>
                <p>4. Após ativação, os emails serão enviados normalmente</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 