import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CandidatoExternoProvider } from "@/contexts/CandidatoExternoContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Consultores from "./pages/Consultores";
import GerenciarPermissoes from "./pages/GerenciarPermissoes";
import Vagas from "./pages/Vagas";
import Curriculos from "./pages/Curriculos";
import PosicoesFechadas from "./pages/relatorios/PosicoesFechadas";
import Financeiro from "./pages/relatorios/Financeiro";
import VagaPublica from "./pages/VagaPublica";
import CandidatoLogin from "./pages/CandidatoLogin";
import CandidatoRegister from "./pages/CandidatoRegister";
import CandidatoRecuperarSenha from "./pages/CandidatoRecuperarSenha";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CandidatoExternoProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/vaga/:vagaId" element={<VagaPublica />} />
              <Route path="/candidato/login" element={<CandidatoLogin />} />
              <Route path="/candidato/register" element={<CandidatoRegister />} />
              <Route path="/candidato/recuperar-senha" element={<CandidatoRecuperarSenha />} />
              
              {/* Rotas protegidas do sistema administrativo */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              } />
              
              <Route path="/consultores" element={
                <ProtectedRoute>
                  <Consultores />
                </ProtectedRoute>
              } />
              
              <Route path="/gerenciar-permissoes" element={
                <ProtectedRoute requireAdmin>
                  <GerenciarPermissoes />
                </ProtectedRoute>
              } />
              
              <Route path="/vagas" element={
                <ProtectedRoute>
                  <Vagas />
                </ProtectedRoute>
              } />
              
              <Route path="/curriculos" element={
                <ProtectedRoute>
                  <Curriculos />
                </ProtectedRoute>
              } />
              
              {/* Relatórios - apenas consultores e admins */}
              <Route path="/relatorios/posicoes-fechadas" element={
                <ProtectedRoute>
                  <PosicoesFechadas />
                </ProtectedRoute>
              } />
              
              {/* Relatório financeiro - apenas admins */}
              <Route path="/relatorios/financeiro" element={
                <ProtectedRoute requireAdmin>
                  <Financeiro />
                </ProtectedRoute>
              } />
              
              {/* Redirecionar rotas não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CandidatoExternoProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
