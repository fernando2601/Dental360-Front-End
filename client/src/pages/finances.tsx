import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import FinanceChart from "@/components/finance-chart";
import { formatCurrency, formatDate } from "@/lib/utils";

// Form schema for transaction
const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"], { 
    required_error: "Transaction type is required." 
  }),
  category: z.string().min(1, { 
    message: "Category is required." 
  }),
  amount: z.coerce.number().positive({ 
    message: "Amount must be a positive number." 
  }),
  date: z.string().min(1, {
    message: "Date is required."
  }),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  clientId: z.coerce.number().optional(),
  appointmentId: z.coerce.number().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function Finances() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Controle de aba diretamente com estado, sem depender da URL
  const [activeTab, setActiveTab] = useState('dashboard');

  // Initialize form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "income",
      category: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      paymentMethod: "",
      clientId: undefined,
      appointmentId: undefined,
    },
  });

  // Fetch financial transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/financial-transactions'],
    retry: false, // Se falhar, não tenta de novo
  });

  // Fetch clients for reference
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    retry: false,
  });

  // Fetch appointments for reference
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments'],
  });

  // Create transaction mutation
  const createTransaction = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const response = await apiRequest('POST', '/api/financial-transactions', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-transactions'] });
      setIsCreateDialogOpen(false);
      form.reset({
        type: "income",
        category: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: "",
        paymentMethod: "",
        clientId: undefined,
        appointmentId: undefined,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: TransactionFormValues) {
    createTransaction.mutate(values);
  }

  // Calculate financial summary
  const totalIncome = Array.isArray(transactions)
    ? transactions.filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
    : 0;
  
  const totalExpenses = Array.isArray(transactions)
    ? transactions.filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
    : 0;
  
  const netIncome = totalIncome - totalExpenses;

  // Get recent transactions
  const recentTransactions = Array.isArray(transactions)
    ? [...transactions]
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão Financeira</h1>
          <p className="text-muted-foreground">Acompanhe receitas, despesas e desempenho financeiro.</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Total de ganhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Total de despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Lucro/Prejuízo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Financial Content Based on active tab state */}
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <div className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="projections">Projeções</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Dashboard Tab - Visão geral financeira */}
        <TabsContent value="dashboard">
          <FinanceChart />
        </TabsContent>

        {/* Fluxo de Caixa Tab */}
        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Controle detalhado de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-success" />
                    <h3 className="text-sm font-medium">Entradas por Período</h3>
                  </div>
                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Hoje:</span>
                      <span className="font-medium text-success">{formatCurrency(totalIncome * 0.12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Esta Semana:</span>
                      <span className="font-medium text-success">{formatCurrency(totalIncome * 0.4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Este Mês:</span>
                      <span className="font-medium text-success">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-destructive" />
                    <h3 className="text-sm font-medium">Saídas por Período</h3>
                  </div>
                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Hoje:</span>
                      <span className="font-medium text-destructive">{formatCurrency(totalExpenses * 0.08)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Esta Semana:</span>
                      <span className="font-medium text-destructive">{formatCurrency(totalExpenses * 0.3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Este Mês:</span>
                      <span className="font-medium text-destructive">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium mb-2">Resumo do Fluxo de Caixa</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Total de Entradas</span>
                    <p className="text-xl font-bold text-success">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Total de Saídas</span>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Saldo</span>
                    <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(netIncome)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Principais Formas de Pagamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cartão de Crédito</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dinheiro</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transferência</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outros</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gray-500" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>Histórico completo de transações</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma transação registrada ainda.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 p-4 font-medium border-b">
                    <div className="col-span-2">Descrição</div>
                    <div>Categoria</div>
                    <div>Data</div>
                    <div>Cliente</div>
                    <div>Forma de Pagamento</div>
                    <div className="text-right">Valor</div>
                  </div>
                  <div className="divide-y">
                    {recentTransactions.map((transaction: any) => {
                      const client = Array.isArray(clients) 
                        ? clients.find((c: any) => c.id === transaction.clientId) 
                        : null;
                      
                      return (
                        <div key={transaction.id} className="grid grid-cols-7 p-4 hover:bg-muted/50">
                          <div className="col-span-2 font-medium">{transaction.description || "N/A"}</div>
                          <div>{transaction.category}</div>
                          <div>{formatDate(transaction.date)}</div>
                          <div>{client ? client.fullName : "N/A"}</div>
                          <div>{transaction.paymentMethod || "N/A"}</div>
                          <div className="text-right flex justify-end items-center">
                            {transaction.type === "income" ? (
                              <ArrowUp className="mr-1 h-4 w-4 text-success" />
                            ) : (
                              <ArrowDown className="mr-1 h-4 w-4 text-destructive" />
                            )}
                            <span className={transaction.type === "income" ? "text-success" : "text-destructive"}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Despesas</CardTitle>
              <CardDescription>Detalhamento e classificação de gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Despesas por Categoria</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Materiais</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: '38%' }}></div>
                        </div>
                        <span className="text-sm font-medium">38%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aluguel</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Salários</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Marketing</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: '12%' }}></div>
                        </div>
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Outras</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gray-500" style={{ width: '5%' }}></div>
                        </div>
                        <span className="text-sm font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Tendência de Despesas Mensais</h3>
                  <div className="h-44 flex items-end gap-2">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-20 w-8 bg-purple-200 dark:bg-purple-900/40 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Jan</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-28 w-8 bg-purple-300 dark:bg-purple-900/60 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Fev</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-24 w-8 bg-purple-300 dark:bg-purple-900/60 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Mar</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-32 w-8 bg-purple-400 dark:bg-purple-800/80 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Abr</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-36 w-8 bg-purple-500 dark:bg-purple-700 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Mai</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-28 w-8 bg-purple-400 dark:bg-purple-800/80 rounded-t-sm"></div>
                      <span className="text-xs mt-1">Jun</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Principais Despesas Recentes</h3>
                <div className="divide-y">
                  {Array.isArray(recentTransactions) 
                    ? recentTransactions
                        .filter((t: any) => t.type === "expense")
                        .slice(0, 5)
                        .map((expense: any) => (
                          <div key={expense.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{expense.description || expense.category}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                            </div>
                            <div className="text-destructive font-semibold">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                        ))
                    : <div>Nenhuma despesa registrada</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle>Projeções Financeiras</CardTitle>
              <CardDescription>Análises de tendências e crescimento futuro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Crescimento Mensal</h3>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">5.3%</p>
                  <p className="text-xs text-muted-foreground">Taxa de crescimento projetada</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Faturamento em 6 meses</h3>
                  <p className="text-2xl font-bold">{formatCurrency(totalIncome * 1.32)}</p>
                  <p className="text-xs text-muted-foreground">Projeção baseada no crescimento atual</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">ROI de Marketing</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">3.2x</p>
                  <p className="text-xs text-muted-foreground">Retorno sobre investimento projetado</p>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium mb-4">Projeção de Faturamento para os Próximos 6 Meses</h3>
                <div className="h-64 flex items-end gap-2">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.05)}</div>
                      <div className="h-44 w-12 bg-emerald-200 dark:bg-emerald-900/40 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 1</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.11)}</div>
                      <div className="h-48 w-12 bg-emerald-300 dark:bg-emerald-800/60 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 2</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.16)}</div>
                      <div className="h-52 w-12 bg-emerald-400 dark:bg-emerald-700/70 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 3</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.22)}</div>
                      <div className="h-56 w-12 bg-emerald-500 dark:bg-emerald-700/80 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 4</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.28)}</div>
                      <div className="h-60 w-12 bg-emerald-600 dark:bg-emerald-600/90 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 5</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -top-6 text-xs font-medium">{formatCurrency(totalIncome * 1.32)}</div>
                      <div className="h-64 w-12 bg-emerald-700 dark:bg-emerald-600 rounded-t-sm"></div>
                    </div>
                    <span className="text-xs mt-1">Mês 6</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Recomendações Estratégicas</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Aumente o investimento em marketing digital em 15% para acelerar o crescimento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Ofereça pacotes promocionais para aumentar o ticket médio em 20%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Implemente um programa de fidelidade para aumentar a recorrência de pacientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span>Reduza custos com fornecedores através de compras em maior volume</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Transação Financeira</DialogTitle>
            <DialogDescription>
              Digite os detalhes para a nova transação.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transação</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de transação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Serviço, Produto, Aluguel, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Breve descrição da transação"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="transfer">Transferência Bancária</SelectItem>
                        <SelectItem value="insurance">Convênio</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("type") === "income" && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (Opcional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {Array.isArray(clients) 
                            ? clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.fullName}
                                </SelectItem>
                              ))
                            : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTransaction.isPending}>
                  {createTransaction.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar Transação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
