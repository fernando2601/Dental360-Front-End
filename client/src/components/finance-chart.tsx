import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

export function FinanceChart() {
  const [dateRange, setDateRange] = useState("month");
  const [currentTab, setCurrentTab] = useState("overview");
  const [showProjection, setShowProjection] = useState(false);

  // Get financial transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/financial-transactions'],
  });

  // Get services for categorization
  const { data: services } = useQuery({
    queryKey: ['/api/services'],
  });

  type ChartDataItem = {
    name: string;
    income: number;
    expenses: number;
    date?: Date;
    month?: number;
    year?: number;
    projected?: boolean;
  };

  type PieChartItem = {
    name: string;
    value: number;
  };

  type ReportMetrics = {
    topServices: any[];
    monthlyGrowth: number;
    averageTicket: number;
    cashOnlyDiscount: number;
    recurrenceRate: number;
  };

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [pieData, setPieData] = useState<PieChartItem[]>([]);
  const [projectionData, setProjectionData] = useState<ChartDataItem[]>([]);
  const [reportData, setReportData] = useState<ReportMetrics>({
    topServices: [],
    monthlyGrowth: 0,
    averageTicket: 0,
    cashOnlyDiscount: 5, // 5% discount for cash payments
    recurrenceRate: 68 // 68% of clients return
  });
  
  useEffect(() => {
    if (!transactions) return;

    // Process data based on selected date range
    const todayDate = new Date();
    let startDate: Date;
    
    if (dateRange === "week") {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 7);
    } else if (dateRange === "month") {
      startDate = new Date(todayDate);
      startDate.setMonth(todayDate.getMonth() - 1);
    } else if (dateRange === "quarter") {
      startDate = new Date(todayDate);
      startDate.setMonth(todayDate.getMonth() - 3);
    } else { // year
      startDate = new Date(todayDate);
      startDate.setFullYear(todayDate.getFullYear() - 1);
    }

    // Filter transactions by date
    const filteredTransactions = transactions.filter((t: any) => 
      new Date(t.date) >= startDate && new Date(t.date) <= todayDate
    );

    // Prepare chart data
    const data: any = [];
    const categoryData: Record<string, number> = {};
    
    if (dateRange === "week") {
      // Group by day of week
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      days.forEach(day => {
        data.push({
          name: day.substring(0, 3),
          income: 0,
          expenses: 0,
        });
      });
      
      filteredTransactions.forEach((t: any) => {
        const day = new Date(t.date).getDay();
        if (t.type === "income") {
          data[day].income += Number(t.amount);
        } else {
          data[day].expenses += Number(t.amount);
        }
        
        // Accumulate category data
        categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
      });
    } else if (dateRange === "month") {
      // Create entries for each day of the month
      const daysInPeriod = 30;
      for (let i = 0; i < daysInPeriod; i++) {
        const date = new Date(todayDate);
        date.setDate(todayDate.getDate() - (daysInPeriod - i - 1));
        
        data.push({
          name: date.getDate().toString(),
          date: date,
          income: 0,
          expenses: 0,
        });
      }
      
      filteredTransactions.forEach((t: any) => {
        const tDate = new Date(t.date);
        const dayIndex = data.findIndex(d => 
          d.date.getDate() === tDate.getDate() &&
          d.date.getMonth() === tDate.getMonth() &&
          d.date.getFullYear() === tDate.getFullYear()
        );
        
        if (dayIndex >= 0) {
          if (t.type === "income") {
            data[dayIndex].income += Number(t.amount);
          } else {
            data[dayIndex].expenses += Number(t.amount);
          }
        }
        
        // Accumulate category data
        categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
      });
      
      // Clean up data for rendering
      data.forEach(d => {
        d.name = d.date.getDate().toString();
        delete d.date;
      });
    } else if (dateRange === "quarter" || dateRange === "year") {
      // Group by month
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const monthCount = dateRange === "quarter" ? 3 : 12;
      for (let i = 0; i < monthCount; i++) {
        const date = new Date(todayDate);
        date.setMonth(todayDate.getMonth() - (monthCount - i - 1));
        
        data.push({
          name: monthNames[date.getMonth()],
          month: date.getMonth(),
          year: date.getFullYear(),
          income: 0,
          expenses: 0,
        });
      }
      
      filteredTransactions.forEach((t: any) => {
        const tDate = new Date(t.date);
        const monthIndex = data.findIndex(d => 
          d.month === tDate.getMonth() && d.year === tDate.getFullYear()
        );
        
        if (monthIndex >= 0) {
          if (t.type === "income") {
            data[monthIndex].income += Number(t.amount);
          } else {
            data[monthIndex].expenses += Number(t.amount);
          }
        }
        
        // Accumulate category data
        categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
      });
      
      // Clean up data for rendering
      data.forEach(d => {
        delete d.month;
        delete d.year;
      });
    }

    // Prepare pie chart data
    const pieChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    
    // Calculate financial projections based on historical data
    const projections = [];
    const months = 6; // Project 6 months into the future
    
    // Get average monthly growth rate from past data
    let avgGrowthRate = 0.05; // Default to 5% if insufficient data
    let avgExpenseRate = 0.03; // Default to 3% expense growth
    
    if (dateRange === "quarter" || dateRange === "year") {
      // Calculate growth rate from existing data if we have enough months
      const incomeByMonth = data.map(d => d.income);
      
      if (incomeByMonth.length >= 3) {
        // Use last 3 months to calculate average monthly growth
        const growthRates = [];
        for (let i = 1; i < Math.min(4, incomeByMonth.length); i++) {
          if (incomeByMonth[i-1] > 0) {
            growthRates.push((incomeByMonth[i] - incomeByMonth[i-1]) / incomeByMonth[i-1]);
          }
        }
        
        if (growthRates.length > 0) {
          avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
          // Cap growth rate between -20% and +40%
          avgGrowthRate = Math.max(-0.2, Math.min(0.4, avgGrowthRate));
        }
      }
    }
    
    // Start with the most recent income and expense values for projection
    let lastIncome = data.length > 0 ? data[data.length - 1].income : 0;
    let lastExpense = data.length > 0 ? data[data.length - 1].expenses : 0;
    
    if (lastIncome === 0) lastIncome = 1000; // Default starting value if no data
    if (lastExpense === 0) lastExpense = 500; // Default starting value if no data
    
    // Generate projection data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    
    for (let i = 1; i <= months; i++) {
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(currentDate.getMonth() + i);
      
      lastIncome = lastIncome * (1 + avgGrowthRate);
      lastExpense = lastExpense * (1 + avgExpenseRate);
      
      projections.push({
        name: monthNames[projectionDate.getMonth()],
        income: Math.round(lastIncome),
        expenses: Math.round(lastExpense),
        projected: true
      });
    }
    
    // Calculate business metrics for reports
    const reportMetrics = {
      topServices: [] as any[],
      monthlyGrowth: Math.round(avgGrowthRate * 100),
      averageTicket: 0,
      cashOnlyDiscount: 5, // 5% discount for cash payments
      recurrenceRate: 68 // 68% of clients return
    };
    
    // Calculate average ticket from income transactions
    const incomeTransactions = transactions.filter((t: any) => t.type === "income");
    if (incomeTransactions.length > 0) {
      const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      reportMetrics.averageTicket = Math.round(totalIncome / incomeTransactions.length);
    }
    
    setChartData(data);
    setPieData(pieChartData);
    setProjectionData(projections);
    setReportData(reportMetrics);
  }, [transactions, dateRange]);

  // Calculate totals
  const totalIncome = chartData?.reduce((sum, entry) => sum + entry.income, 0) || 0;
  const totalExpenses = chartData?.reduce((sum, entry) => sum + entry.expenses, 0) || 0;
  const netIncome = totalIncome - totalExpenses;

  const dateRangeOptions = [
    { value: "week", label: "Últimos 7 Dias" },
    { value: "month", label: "Últimos 30 Dias" },
    { value: "quarter", label: "Últimos 3 Meses" },
    { value: "year", label: "Últimos 12 Meses" },
  ];

  const COLORS = ['#2C7EA1', '#5BC0BE', '#3D9E9C', '#1A6985', '#9AA5B1', '#7B8794', '#616E7C'];

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Visão Geral Financeira</CardTitle>
          <CardDescription>
            Monitore receitas, despesas e tendências financeiras
          </CardDescription>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Receita Total</h3>
            <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Despesas Totais</h3>
            <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Lucro Líquido</h3>
            <p className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="projections">Projeções</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          <TabsContent value="categories" className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
          <TabsContent value="projections" className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Projeções Financeiras para os Próximos 6 Meses</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Taxa de crescimento mensal estimada:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400">
                      {reportData.monthlyGrowth}%
                    </Badge>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$${value}`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Receita Projetada"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Despesas Projetadas"
                      stroke="#F43F5E"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </TabsContent>
          <TabsContent value="reports" className="w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Métricas Financeiras</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Crescimento Mensal Estimado</p>
                        <p className="text-2xl font-medium">{reportData.monthlyGrowth}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-2xl font-medium">{formatCurrency(reportData.averageTicket)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                        <p className="text-2xl font-medium">
                          {totalIncome > 0 ? Math.round((netIncome / totalIncome) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Políticas de Pagamento</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Desconto para Pagamento à Vista</p>
                        <p className="text-2xl font-medium">{reportData.cashOnlyDiscount}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Recorrência de Clientes</p>
                        <p className="text-2xl font-medium">{reportData.recurrenceRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Com base nas projeções atuais, sua clínica tem potencial para crescer {reportData.monthlyGrowth}% ao mês</li>
                    <li>Para melhorar seus resultados, considere aumentar sua taxa de recorrência de clientes, atualmente em {reportData.recurrenceRate}%</li>
                    <li>Seu ticket médio de {formatCurrency(reportData.averageTicket)} pode ser aumentado com serviços adicionais e pacotes</li>
                    <li>Para aumentar o fluxo de caixa, considere oferecer descontos para pagamentos antecipados</li>
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FinanceChart;
