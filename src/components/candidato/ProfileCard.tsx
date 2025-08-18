import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Edit3,
  Save,
  X,
  CheckCircle,
  FileText,
  Upload,
  Loader2,
  Eye
} from 'lucide-react';
import { CandidatoExterno, UpdateCandidatoExterno } from '../../../supabase/types';

interface ProfileCardProps {
  candidato: CandidatoExterno;
  onUpdateProfile: (data: UpdateCandidatoExterno) => Promise<boolean>;
  onUploadCurriculo: (file: File) => Promise<boolean>;
  isUpdating?: boolean;
  isUploading?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  candidato,
  onUpdateProfile,
  onUploadCurriculo,
  isUpdating = false,
  isUploading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateCandidatoExterno>({
    nome: candidato.nome || '',
    telefone: candidato.telefone || '',
    data_nascimento: candidato.data_nascimento || '',
    endereco: candidato.endereco || '',
    cidade: candidato.cidade || '',
    estado: candidato.estado || '',
    cep: candidato.cep || ''
  });

  const handleSave = async () => {
    const success = await onUpdateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadCurriculo(file);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: candidato.nome || '',
      telefone: candidato.telefone || '',
      data_nascimento: candidato.data_nascimento || '',
      endereco: candidato.endereco || '',
      cidade: candidato.cidade || '',
      estado: candidato.estado || '',
      cep: candidato.cep || ''
    });
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Meu Perfil
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="bg-white hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isEditing ? (
          <>
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informações Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nome Completo</p>
                  <p className="font-medium">{candidato.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data de Nascimento</p>
                  <p className="font-medium">
                    {candidato.data_nascimento 
                      ? new Date(candidato.data_nascimento).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações de Contato */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">E-mail</p>
                  <p className="font-medium">{candidato.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefone</p>
                  <p className="font-medium">{candidato.telefone || '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Endereço</p>
                  <p className="font-medium">{candidato.endereco || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cidade/Estado</p>
                  <p className="font-medium">
                    {candidato.cidade && candidato.estado 
                      ? `${candidato.cidade}, ${candidato.estado}`
                      : candidato.cidade || candidato.estado || '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">CEP</p>
                  <p className="font-medium">{candidato.cep || '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Currículo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Currículo
                </h3>
                {candidato.curriculo_url && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Anexado
                  </Badge>
                )}
              </div>
              
              {candidato.curriculo_url ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate" title={candidato.curriculo_nome || 'curriculo.pdf'}>
                          {candidato.curriculo_nome || 'curriculo.pdf'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {candidato.curriculo_tamanho && 
                            `${(candidato.curriculo_tamanho / 1024 / 1024).toFixed(2)} MB`
                          } • Enviado em {new Date(candidato.data_cadastro).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      {/* Visualizar Currículo */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(candidato.curriculo_url, '_blank')}
                        className="bg-white hover:bg-gray-50"
                        title="Visualizar currículo"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Alterar Currículo */}
                      <input
                        type="file"
                        id="curriculo-update"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('curriculo-update')?.click()}
                        disabled={isUploading}
                        className="bg-white hover:bg-gray-50"
                        title="Alterar currículo"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="curriculo-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Anexe seu currículo</p>
                      <p className="text-xs text-gray-500">PDF, DOC ou DOCX (máx. 5MB)</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('curriculo-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Arquivo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações da Conta */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Membro desde:</strong> {new Date(candidato.data_cadastro).toLocaleDateString('pt-BR')}
              </p>
              {candidato.ultimo_login && (
                <p>
                  <strong>Último login:</strong> {new Date(candidato.ultimo_login).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </>
        ) : (
          /* Formulário de Edição */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Seu endereço completo"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="Sua cidade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={isUpdating || !formData.nome.trim()}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 