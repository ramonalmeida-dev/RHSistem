import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { usuario, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (roleName?: string) => {
    switch (roleName) {
      case 'admin_master': return 'Admin Master';
      case 'admin_nivel1': return 'Admin Nível 1';
      case 'diretoria': return 'Diretoria';
      case 'coordenador': return 'Coordenador';
      case 'consultor': return 'Consultor';
      default: return 'Usuário';
    }
  };

  const getRoleColor = (roleName?: string) => {
    switch (roleName) {
      case 'admin_master': return 'bg-red-100 text-red-800';
      case 'admin_nivel1': return 'bg-orange-100 text-orange-800';
      case 'diretoria': return 'bg-purple-100 text-purple-800';
      case 'coordenador': return 'bg-blue-100 text-blue-800';
      case 'consultor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={usuario ? "/placeholder-avatar.jpg" : "/logo.jpeg"} 
                    alt={usuario?.nome || "Lotus Recruit Hub"} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {usuario ? getUserInitials(usuario.nome) : "LR"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{usuario?.nome || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                    <Badge className={`text-xs px-2 py-0 ${getRoleColor(usuario?.role_nome)}`}>
                      {getRoleLabel(usuario?.role_nome)}
                    </Badge>
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {usuario?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}