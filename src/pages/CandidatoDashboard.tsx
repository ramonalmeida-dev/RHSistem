import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidatoExterno } from '../contexts/CandidatoExternoContext';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ProfileCard } from '../components/candidato/ProfileCard';
import { CandidaturasCard } from '../components/candidato/CandidaturasCard';
import { DashboardStats } from '../components/candidato/DashboardStats';
import { 
  Loader2, 
  User, 
  LogOut, 
  Bell
} from 'lucide-react';

const CandidatoDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    candidato, 
    candidaturas, 
    loading, 
    error, 
    logout, 
    loadCandidaturas,
    updateProfile,
    uploadCurriculo,
    isAuthenticated 
  } = useCandidatoExterno();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/candidato/login');
      return;
    }

    loadCandidaturas();
  }, [isAuthenticated, navigate, loadCandidaturas]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };



  if (!isAuthenticated || !candidato) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profissional */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bem-vindo, {candidato.nome?.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-600">
                  Gerencie suas candidaturas e perfil profissional
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {candidaturas.some(c => c.status === 'aprovado') && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                )}
              </Button>

              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert de Erro */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Estatísticas do Dashboard */}
        <DashboardStats candidaturas={candidaturas} />

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil do Candidato */}
          <div className="lg:col-span-1">
            <ProfileCard
              candidato={candidato}
              onUpdateProfile={updateProfile}
              onUploadCurriculo={uploadCurriculo}
              isUpdating={loading}
              isUploading={loading}
            />
          </div>

          {/* Candidaturas */}
          <div className="lg:col-span-2">
            <CandidaturasCard
              candidaturas={candidaturas}
              loading={loading}
            />
          </div>
        </div>


      </div>
    </div>
  );
};

export default CandidatoDashboard; 