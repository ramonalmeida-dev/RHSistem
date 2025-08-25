import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { HistoricoEmail } from "@/lib/posicoesFechadasService";

interface HistoricoEmailsProps {
  historicoEmails: HistoricoEmail[];
}

export const HistoricoEmails = ({ historicoEmails }: HistoricoEmailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Histórico de Emails
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {historicoEmails.map((email) => (
            <div key={email.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{email.assunto}</p>
                <Badge variant="outline">
                  {new Date(email.data_envio).toLocaleDateString('pt-BR')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Para: {email.destinatario_email}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {email.corpo_email}
              </p>
              {email.anexos.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Anexos: {email.anexos.length} arquivo(s)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 