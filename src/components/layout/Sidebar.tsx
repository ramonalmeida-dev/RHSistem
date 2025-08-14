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
  DollarSign
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
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
    title: "Vagas",
    href: "/vagas", 
    icon: Briefcase,
    badge: "12"
  },
  {
    title: "Candidatos",
    href: "/candidatos",
    icon: UserPlus,
  },
  {
    title: "Banco de CVs",
    href: "/curriculos",
    icon: FileUser,
  },
];

const reportNavItems: NavItem[] = [
  {
    title: "Vagas Abertas",
    href: "/relatorios/vagas-abertas",
    icon: Search,
  },
  {
    title: "Posições Fechadas",
    href: "/relatorios/posicoes-fechadas",
    icon: Calendar,
  },
  {
    title: "Financeiro",
    href: "/relatorios/financeiro",
    icon: DollarSign,
  },
  {
    title: "Análises",
    href: "/relatorios/analises",
    icon: BarChart3,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
            isActive && "bg-primary/10 text-primary border-primary/20"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
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
        "relative bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-primary">LOTUSAREV</h1>
              <p className="text-xs text-muted-foreground">Recrutamento & Seleção</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-custom-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-2">
                Principal
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-2">
                Relatórios
              </p>
            )}
            {reportNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <Link to="/configuracoes">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  collapsed && "justify-center px-2"
                )}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>Configurações</span>}
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}