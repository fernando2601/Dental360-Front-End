import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Users,
  Package,
  DollarSign,
  FileText,
  UserCircle,
  Settings,
  Home,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  Building,
  Gift,
  BadgePercent,
  Images,
  LayoutDashboard,
  LineChart,
  Receipt,
  BarChart,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const isMobile = useMobile();

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile]);

  return (
    <aside
      className={cn(
        "group border-r bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[240px]",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-3">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <Zap className="h-6 w-6 text-primary" />
            {!collapsed && <span className="font-heading font-bold text-xl">DentalSpa</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto h-8 w-8", collapsed && "hidden group-hover:flex absolute right-2")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-2 p-2">
            <div className="px-4 py-2">
              <h3 className={cn("text-xs font-medium text-muted-foreground", collapsed && "sr-only")}>
                Principal
              </h3>
            </div>
            <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Início" collapsed={collapsed} active={location === "/"} />
            <NavLink href="/appointments" icon={<Calendar className="h-4 w-4" />} label="Agendamentos" collapsed={collapsed} active={location === "/appointments"} />
            <NavLink href="/clients" icon={<Users className="h-4 w-4" />} label="Pacientes" collapsed={collapsed} active={location === "/clients"} />
            <NavLink href="/inventory" icon={<Package className="h-4 w-4" />} label="Estoque" collapsed={collapsed} active={location === "/inventory"} />
            
            <NavLink href="/finances" icon={<DollarSign className="h-4 w-4" />} label="Finanças" collapsed={collapsed} active={location.startsWith("/finances")} />
            
            <NavLink href="/services" icon={<FileText className="h-4 w-4" />} label="Serviços" collapsed={collapsed} active={location === "/services"} />
            <NavLink href="/staff" icon={<UserCircle className="h-4 w-4" />} label="Equipe" collapsed={collapsed} active={location === "/staff"} />
            <NavLink href="/knowledge" icon={<BookOpen className="h-4 w-4" />} label="Área de Aprendizado" collapsed={collapsed} active={location === "/knowledge"} />
            <NavLink href="/whatsapp" icon={<FaWhatsapp className="h-4 w-4" />} label="WhatsApp" collapsed={collapsed} active={location === "/whatsapp"} />
            <NavLink href="/packages" icon={<Gift className="h-4 w-4" />} label="Pacotes" collapsed={collapsed} active={location === "/packages"} />
            <NavLink href="/subscriptions" icon={<BadgePercent className="h-4 w-4" />} label="Assinatura" collapsed={collapsed} active={location === "/subscriptions"} />
            <NavLink href="/clinic-info" icon={<Building className="h-4 w-4" />} label="Dados da Clínica" collapsed={collapsed} active={location === "/clinic-info"} />
            <NavLink href="/before-after" icon={<Images className="h-4 w-4" />} label="Antes & Depois" collapsed={collapsed} active={location === "/before-after"} />
          </nav>
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              DS
            </div>
            {!collapsed && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Dr. Sarah</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
  notification?: number;
}

function NavLink({ href, icon, label, collapsed, active, notification }: NavLinkProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent cursor-pointer",
          active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          collapsed && "justify-center"
        )}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
        {!collapsed && notification && (
          <Badge className="ml-auto" variant="secondary">
            {notification}
          </Badge>
        )}
        {collapsed && notification && (
          <Badge className="absolute right-2 top-1" variant="secondary">
            {notification}
          </Badge>
        )}
      </div>
    </Link>
  );
}

interface NavSubmenuProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
  children: React.ReactNode;
  onTabSelect?: (tab: string) => void;
}

function NavSubmenu({ icon, label, collapsed, active, children, onTabSelect }: NavSubmenuProps) {
  const [isOpen, setIsOpen] = useState(active);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent cursor-pointer",
          active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          collapsed && "justify-center"
        )}
        onClick={() => !collapsed && setIsOpen(!isOpen)}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
        {!collapsed && (
          <span className="ml-auto">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </div>
      {!collapsed && isOpen && (
        <div className="pl-8 space-y-1">
          {onTabSelect 
            ? React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child, {
                    onClick: (e: React.MouseEvent) => {
                      e.preventDefault();
                      // Extrair o tab do href: "/finances?tab=dashboard" -> "dashboard"
                      const tabMatch = child.props.href?.match(/\?tab=([^&]+)/);
                      if (tabMatch && tabMatch[1]) {
                        onTabSelect(tabMatch[1]);
                      }
                    }
                  });
                }
                return child;
              })
            : children
          }
        </div>
      )}
    </div>
  );
}

interface SubNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function SubNavLink({ href, icon, label, active, onClick }: SubNavLinkProps) {
  return (
    <a href={href} className="no-underline" onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent cursor-pointer",
          active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    </a>
  );
}

export default Sidebar;
