import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
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
  },
  {
    title: "Usuários",
    href: "/consultores",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Vagas",
    href: "/vagas", 
    icon: Briefcase,
  },

  {
    title: "Banco de CVs",
    href: "/curriculos",
    icon: FileUser,
  },
];

const reportNavItems: NavItem[] = [
  {
    title: "Posições Fechadas",
    href: "/relatorios/posicoes-fechadas",
    icon: Calendar,
  },
  {
    title: "Financeiro",
    href: "/relatorios/financeiro",
    icon: DollarSign,
    adminOnly: true,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.tipo === "admin";

  // Filtrar itens baseado no tipo de usuário
  const filteredMainNavItems = mainNavItems.filter(item => 
    !item.adminOnly || isAdmin
  );

  const filteredReportNavItems = reportNavItems.filter(item => 
    !item.adminOnly || isAdmin
  );

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link to={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-10",
            collapsed && "justify-center px-2",
            isActive && "bg-secondary text-secondary-foreground"
          )}
        >
          <Icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.adminOnly && (
                <Shield className="h-3 w-3 text-muted-foreground" />
              )}
            </>
          )}
        </Button>
      </Link>
    );
  };

  return (
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
              "text-xs font-semibold text-muted-foreground",
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
              "text-xs font-semibold text-muted-foreground",
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
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>{isAdmin ? "Administrador" : "Consultor"}</span>
          </div>
        </div>
      )}
    </div>
  );
}