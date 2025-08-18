import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Filter,
  Eye,
  Loader2,
  Briefcase,
  Clock,
  Star,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VagaPublica {
  id: string;
  numero_vaga: string;
  cargo: string;
  salario: string;
  local_trabalho: string;
  status: string;
  data_recebimento: string;
  perfil_word: string;
  informacoes_complementares: string;
  empresa: {
    razao_social: string;
    cnpj: string;
  };
}

const CandidatoVagas: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, candidato, verificarCandidatura } = useCandidatoExterno();
  
  const [vagas, setVagas] = useState<VagaPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocal, setFiltroLocal] = useState<string>('');
  const [filtroSalario, setFiltroSalario] = useState<string>('');
  const [candidaturasMap, setCandidaturasMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/candidato/login');
      return;
    }
    loadVagas();
  }, [isAuthenticated, navigate]);

  const loadVagas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: vagasData, error: vagasError } = await supabase
        .from('vagas')
        .select(`
          id,
          numero_vaga,
          cargo,
          salario,
          local_trabalho,
          status,
          data_recebimento,
          perfil_word,
          informacoes_complementares,
          clientes:empresa_id(razao_social, cnpj)
        `)
        .eq('status', 'publicada')
        .order('data_recebimento', { ascending: false });

      if (vagasError) {
        console.error('Erro ao carregar vagas:', vagasError);
        setError('Erro ao carregar vagas');
        return;
      }

      // Transformar dados para o formato esperado
      const vagasFormatadas = vagasData?.map(vaga => ({
        ...vaga,
        empresa: Array.isArray(vaga.clientes) ? vaga.clientes[0] : vaga.clientes
      })) || [];

      setVagas(vagasFormatadas);

      // Verificar candidaturas
      if (candidato && vagasFormatadas.length > 0) {
        const candidaturasCheck: Record<string, boolean> = {};
        
        for (const vaga of vagasFormatadas) {
          try {
            const jaCandidatou = await verificarCandidatura(vaga.id);
            candidaturasCheck[vaga.id] = jaCandidatou;
          } catch (error) {
            console.error(`Erro ao verificar candidatura para vaga ${vaga.id}:`, error);
            candidaturasCheck[vaga.id] = false;
          }
        }
        
        setCandidaturasMap(candidaturasCheck);
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVaga = (vagaId: string) => {
    navigate(`/vaga/${vagaId}`);
  };

  const filteredVagas = vagas.filter(vaga => {
    const matchesSearch = 
      vaga.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.empresa.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.local_trabalho.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocal = !filtroLocal || vaga.local_trabalho.toLowerCase().includes(filtroLocal.toLowerCase());
    
    const matchesSalario = !filtroSalario || (() => {
      const salario = parseFloat(vaga.salario.replace(/[^\d,]/g, '').replace(',', '.'));
      switch (filtroSalario) {
        case 'ate-3000': return salario <= 3000;
        case '3000-5000': return salario > 3000 && salario <= 5000;
        case '5000-8000': return salario > 5000 && salario <= 8000;
        case 'acima-8000': return salario > 8000;
        default: return true;
      }
    })();

    return matchesSearch && matchesLocal && matchesSalario;
  });

  const getLocaisUnicos = () => {
    const locais = vagas.map(v => v.local_trabalho).filter(Boolean);
    return [...new Set(locais)];
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/candidato/dashboard')}
                className="lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vagas Disponíveis</h1>
                <p className="text-sm text-gray-600">
                  {filteredVagas.length} oportunidade{filteredVagas.length !== 1 ? 's' : ''} encontrada{filteredVagas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/candidato/dashboard')} variant="outline">
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros de Busca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cargo, empresa ou localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Localização</label>
                <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as localizações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as localizações</SelectItem>
                    {getLocaisUnicos().map(local => (
                      <SelectItem key={local} value={local}>{local}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Faixa Salarial</label>
                <Select value={filtroSalario} onValueChange={setFiltroSalario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer salário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer salário</SelectItem>
                    <SelectItem value="ate-3000">Até R$ 3.000</SelectItem>
                    <SelectItem value="3000-5000">R$ 3.000 - R$ 5.000</SelectItem>
                    <SelectItem value="5000-8000">R$ 5.000 - R$ 8.000</SelectItem>
                    <SelectItem value="acima-8000">Acima de R$ 8.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vagas */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando vagas...</p>
          </div>
        ) : filteredVagas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma vaga encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou verificar novamente mais tarde.
              </p>
              <Button onClick={() => {
                setSearchTerm('');
                setFiltroLocal('');
                setFiltroSalario('');
              }}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVagas.map((vaga) => (
              <Card key={vaga.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{vaga.cargo}</CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <Building2 className="h-4 w-4" />
                        <span>{vaga.empresa.razao_social}</span>
                      </CardDescription>
                    </div>
                    
                    {candidaturasMap[vaga.id] && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="h-3 w-3 mr-1" />
                        Candidatado
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{vaga.local_trabalho}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {vaga.salario}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Vaga {vaga.numero_vaga}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(vaga.data_recebimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {vaga.perfil_word && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {vaga.perfil_word.length > 150 
                          ? `${vaga.perfil_word.substring(0, 150)}...` 
                          : vaga.perfil_word
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewVaga(vaga.id)}
                      className="flex-1"
                      variant={candidaturasMap[vaga.id] ? "outline" : "default"}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {candidaturasMap[vaga.id] ? 'Ver Aplicação' : 'Ver Detalhes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatoVagas; 