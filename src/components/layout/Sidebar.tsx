import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileUser, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserPlus,
  Search,
  Calendar,
  DollarSign,
  Shield
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  permissao?: string;
  nivelAcesso?: number;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Building2,
    permissao: "clientes_visualizar",
  },
  {
    title: "Usuários",
    href: "/consultores",
    icon: Users,
    permissao: "usuarios_visualizar",
  },
  {
    title: "Vagas",
    href: "/vagas", 
    icon: Briefcase,
    permissao: "vagas_visualizar",
  },
  {
    title: "Banco de CVs",
    href: "/curriculos",
    icon: FileUser,
    permissao: "candidatos_visualizar",
  },
];

const reportNavItems: NavItem[] = [
  {
    title: "Posições Fechadas",
    href: "/relatorios/posicoes-fechadas",
    icon: Calendar,
    permissao: "posicoes_fechadas_visualizar",
  },
  {
    title: "Financeiro",
    href: "/relatorios/financeiro",
    icon: DollarSign,
    permissao: "relatorios_financeiro",
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { usuario, temPermissao } = useAuth();

  // Filtrar itens baseado nas permissões do usuário
  const filteredMainNavItems = mainNavItems.filter(item => 
    !item.permissao || temPermissao(item.permissao)
  );

  const filteredReportNavItems = reportNavItems.filter(item => 
    !item.permissao || temPermissao(item.permissao)
  );

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const buttonContent = (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 h-10",
          collapsed && "justify-center px-2",
          isActive && "bg-secondary text-secondary-foreground"
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", collapsed && "h-5 w-5")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex-shrink-0">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Button>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={item.href}>
              {buttonContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link to={item.href}>
        {buttonContent}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex h-full flex-col border-r bg-background",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex justify-start">
          <img 
            src="/logo.jpeg" 
            alt="Lotus Recruit Hub" 
            className="h-16 w-24 rounded-lg object-contain"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          <div className="px-2 py-1">
            <h3 className={cn(
              "text-xs font-semibold text-muted-foreground truncate",
              collapsed && "sr-only"
            )}>
              Principal
            </h3>
          </div>
          {filteredMainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="px-2 py-1">
            <h3 className={cn(
              "text-xs font-semibold text-muted-foreground truncate",
              collapsed && "sr-only"
            )}>
              Relatórios
            </h3>
          </div>
          {filteredReportNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && usuario && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 flex-shrink-0" />
            <span className="truncate font-medium">
              {usuario.role_nome?.replace('_', ' ').toUpperCase() || 'Usuário'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {usuario.nome || 'Nome não informado'}
          </div>
        </div>
      )}
      
      {/* Footer collapsed */}
      {collapsed && usuario && (
        <div className="border-t p-2">
          <div className="flex flex-col items-center gap-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="text-[10px] text-muted-foreground text-center leading-tight">
              {usuario.role_nome?.replace('_', ' ').toUpperCase().slice(0, 3) || 'USR'}
            </div>
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}