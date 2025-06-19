import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Package, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "success" | "warning" | "danger";
  loading?: boolean;
}

export function StatsCard({ title, value, icon, trend, variant = "default", loading = false }: StatsCardProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    danger: "bg-destructive text-destructive-foreground"
  };

  const iconBgClass = {
    default: "bg-primary-light",
    success: "bg-success/20",
    warning: "bg-warning/20",
    danger: "bg-destructive/20"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                {trend && <Skeleton className="h-5 w-24" />}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
                {trend && (
                  <p className={cn("text-sm flex items-center mt-1", 
                    trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {trend.value > 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                    <span>{Math.abs(trend.value)}% {trend.label}</span>
                  </p>
                )}
              </>
            )}
          </div>
          <div className={cn("p-3 rounded-full", iconBgClass[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  // Query for appointments count
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
  });

  // Query for clients count
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Query for inventory count
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/inventory'],
  });

  // Query for financial data
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/financial-transactions'],
  });

  // Calculate total revenue
  const totalRevenue = transactions?.filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

  // Calculate inventory alerts
  const inventoryAlerts = inventory?.filter((item: any) => 
    item.quantity <= item.threshold
  ).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Próximos Agendamentos"
        value={isLoadingAppointments ? "..." : appointments?.length || 0}
        icon={<CalendarDays className="h-6 w-6 text-primary" />}
        trend={{ value: 12, label: "vs. semana anterior" }}
        loading={isLoadingAppointments}
      />
      <StatsCard
        title="Total de Pacientes"
        value={isLoadingClients ? "..." : clients?.length || 0}
        icon={<Users className="h-6 w-6 text-primary" />}
        trend={{ value: 8, label: "vs. mês anterior" }}
        loading={isLoadingClients}
        variant="success"
      />
      <StatsCard
        title="Alertas de Estoque"
        value={isLoadingInventory ? "..." : inventoryAlerts}
        icon={<Package className="h-6 w-6 text-primary" />}
        variant={inventoryAlerts > 0 ? "warning" : "default"}
        loading={isLoadingInventory}
      />
      <StatsCard
        title="Receita Total"
        value={isLoadingTransactions ? "..." : formatCurrency(totalRevenue)}
        icon={<DollarSign className="h-6 w-6 text-primary" />}
        trend={{ value: 15, label: "vs. mês anterior" }}
        loading={isLoadingTransactions}
        variant="success"
      />
    </div>
  );
}

export default DashboardStats;
