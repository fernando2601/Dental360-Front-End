import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Calendar, 
  Users, 
  Package, 
  DollarSign, 
  FileText, 
  UserCircle, 
  Settings, 
  Building, 
  Gift, 
  BadgePercent,
  MessageSquare,
  BarChart2
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="flex items-center gap-2 border-b pb-4">
          <span className="font-bold text-lg">DentalSpa</span>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Início" onClick={() => setOpen(false)} />
          <NavItem href="/appointments" icon={<Calendar className="h-5 w-5" />} label="Agendamentos" onClick={() => setOpen(false)} />
          <NavItem href="/clients" icon={<Users className="h-5 w-5" />} label="Pacientes" onClick={() => setOpen(false)} />
          <NavItem href="/inventory" icon={<Package className="h-5 w-5" />} label="Estoque" onClick={() => setOpen(false)} />
          <NavItem href="/finances" icon={<DollarSign className="h-5 w-5" />} label="Finanças" onClick={() => setOpen(false)} />
          <NavItem href="/services" icon={<FileText className="h-5 w-5" />} label="Serviços" onClick={() => setOpen(false)} />
          <NavItem href="/staff" icon={<UserCircle className="h-5 w-5" />} label="Equipe" onClick={() => setOpen(false)} />
          <NavItem href="/whatsapp" icon={<FaWhatsapp className="h-5 w-5" />} label="WhatsApp" onClick={() => setOpen(false)} />
          <NavItem href="/packages" icon={<Gift className="h-5 w-5" />} label="Pacotes" onClick={() => setOpen(false)} />
          <NavItem href="/subscriptions" icon={<BadgePercent className="h-5 w-5" />} label="Assinatura" onClick={() => setOpen(false)} />
          <NavItem href="/clinic-info" icon={<Building className="h-5 w-5" />} label="Dados da Clínica" onClick={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function NavItem({ href, icon, label, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div 
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}
