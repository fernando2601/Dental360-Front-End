import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Edit, Plus, Users, BadgePercent, ArrowUpRight } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  benefits: string[];
  isActive: boolean;
  memberCount: number;
}

interface SubscriptionMember {
  id: number;
  clientName: string;
  planId: number;
  planName: string;
  startDate: string;
  nextBillingDate: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  paymentMethod: string;
}

export default function SubscriptionsPage() {
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [activeTab, setActiveTab] = useState('planos');

  // Mock data - seria substituído por dados reais da API
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 1,
      name: "Plano Básico",
      description: "Plano de assinatura básico com benefícios essenciais",
      price: 99.90,
      billingCycle: 'monthly',
      benefits: [
        "1 limpeza dental a cada 6 meses",
        "Descontos de 10% em todos os serviços",
        "Consultas de retorno gratuitas"
      ],
      isActive: true,
      memberCount: 27
    },
    {
      id: 2,
      name: "Plano Premium",
      description: "Plano de assinatura premium com benefícios completos",
      price: 199.90,
      billingCycle: 'monthly',
      benefits: [
        "1 limpeza dental a cada 3 meses",
        "1 clareamento a laser anual",
        "Descontos de 20% em todos os serviços",
        "Consultas prioritárias",
        "Consultas de retorno gratuitas"
      ],
      isActive: true,
      memberCount: 15
    },
    {
      id: 3,
      name: "Plano Família",
      description: "Plano de assinatura para famílias com até 4 pessoas",
      price: 299.90,
      billingCycle: 'monthly',
      benefits: [
        "Cobertura para até 4 pessoas",
        "1 limpeza dental por pessoa a cada 6 meses",
        "Descontos de 15% em todos os serviços",
        "Consultas de retorno gratuitas"
      ],
      isActive: true,
      memberCount: 8
    }
  ];

  const subscriptionMembers: SubscriptionMember[] = [
    {
      id: 1,
      clientName: "Maria Silva",
      planId: 2,
      planName: "Plano Premium",
      startDate: "2023-01-15",
      nextBillingDate: "2023-05-15",
      status: 'active',
      paymentMethod: "Cartão de Crédito"
    },
    {
      id: 2,
      clientName: "João Oliveira",
      planId: 1,
      planName: "Plano Básico",
      startDate: "2023-02-20",
      nextBillingDate: "2023-05-20",
      status: 'active',
      paymentMethod: "Débito Automático"
    },
    {
      id: 3,
      clientName: "Ana Pereira",
      planId: 3,
      planName: "Plano Família",
      startDate: "2023-03-10",
      nextBillingDate: "2023-06-10",
      status: 'active',
      paymentMethod: "Boleto Bancário"
    },
    {
      id: 4,
      clientName: "Carlos Santos",
      planId: 1,
      planName: "Plano Básico",
      startDate: "2022-11-05",
      nextBillingDate: "2023-05-05",
      status: 'pending',
      paymentMethod: "Cartão de Crédito"
    },
    {
      id: 5,
      clientName: "Luciana Martins",
      planId: 2,
      planName: "Plano Premium",
      startDate: "2022-10-15",
      nextBillingDate: "2023-04-15",
      status: 'expired',
      paymentMethod: "Débito Automático"
    }
  ];

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsCreatePlanDialogOpen(true);
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'semiannual': return 'Semestral';
      case 'annual': return 'Anual';
      default: return cycle;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Ativo', color: 'bg-green-100 text-green-700' };
      case 'pending': return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' };
      case 'expired': return { label: 'Expirado', color: 'bg-red-100 text-red-700' };
      case 'cancelled': return { label: 'Cancelado', color: 'bg-gray-100 text-gray-700' };
      default: return { label: status, color: 'bg-blue-100 text-blue-700' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie planos de assinatura e membros.</p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant={activeTab === "membros" ? "default" : "outline"}
            onClick={() => setIsAddMemberDialogOpen(true)} 
            disabled={activeTab !== "membros"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Assinante
          </Button>
          <Button 
            variant={activeTab === "planos" ? "default" : "outline"}
            onClick={() => {
              setEditingPlan(null);
              setIsCreatePlanDialogOpen(true);
            }}
            disabled={activeTab !== "planos"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      <Tabs defaultValue="planos" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="planos">
            <BadgePercent className="mr-2 h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="membros">
            <Users className="mr-2 h-4 w-4" />
            Assinantes
          </TabsTrigger>
          <TabsTrigger value="relatorios">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planos">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subscriptionPlans.map(plan => (
              <Card key={plan.id} className="overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {plan.memberCount} assinantes
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-0 flex-grow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">
                          R$ {plan.price.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          por {getBillingCycleLabel(plan.billingCycle).toLowerCase()}
                        </span>
                      </div>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">Benefícios:</h4>
                      <ul className="space-y-1">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-6">
                  <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Membro
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="membros">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Próxima Cobrança</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionMembers.map(member => {
                    const statusInfo = getStatusLabel(member.status);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.clientName}</TableCell>
                        <TableCell>{member.planName}</TableCell>
                        <TableCell>{new Date(member.startDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{new Date(member.nextBillingDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>{member.paymentMethod}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Clock className="h-4 w-4" />
                              <span className="sr-only">Histórico</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal de Assinaturas</CardTitle>
                <CardDescription>Visualize a receita mensal gerada pelos planos de assinatura</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/20">
                <p className="text-muted-foreground">Gráfico de receita mensal será exibido aqui</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assinantes por Plano</CardTitle>
                <CardDescription>Distribuição de assinantes por plano</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/20">
                <p className="text-muted-foreground">Gráfico de distribuição será exibido aqui</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Taxa de Retenção</CardTitle>
                <CardDescription>Acompanhe a taxa de retenção de assinantes ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/20">
                <p className="text-muted-foreground">Gráfico de retenção será exibido aqui</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plano" : "Criar Novo Plano"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? "Edite as informações do plano e clique em salvar quando terminar." 
                : "Adicione um novo plano de assinatura."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input 
                  id="name" 
                  defaultValue={editingPlan?.name || ""} 
                  placeholder="Ex: Plano Premium" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  defaultValue={editingPlan?.price || ""} 
                  placeholder="Ex: 199.90"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                defaultValue={editingPlan?.description || ""} 
                placeholder="Descreva o plano de assinatura..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing-cycle">Ciclo de Cobrança</Label>
                <Select defaultValue={editingPlan?.billingCycle || "monthly"}>
                  <SelectTrigger id="billing-cycle">
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semiannual">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Switch id="is-active" defaultChecked={editingPlan?.isActive ?? true} />
                  <Label htmlFor="is-active">Plano Ativo</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefícios (um por linha)</Label>
              <Textarea 
                id="benefits" 
                className="min-h-[100px]"
                defaultValue={editingPlan?.benefits.join('\n') || ""}
                placeholder="Digite um benefício por linha...
Ex: 1 limpeza dental a cada 6 meses
Ex: Descontos de 10% em todos os serviços"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPlan ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Adicionar Novo Assinante
            </DialogTitle>
            <DialogDescription>
              Vincule um cliente a um plano de assinatura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client1">Maria Silva</SelectItem>
                  <SelectItem value="client2">João Oliveira</SelectItem>
                  <SelectItem value="client3">Ana Pereira</SelectItem>
                  <SelectItem value="client4">Carlos Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano de Assinatura</Label>
              <Select>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.filter(plan => plan.isActive).map(plan => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - R$ {plan.price.toLocaleString('pt-BR')}/{getBillingCycleLabel(plan.billingCycle).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início</Label>
              <Input 
                id="start-date" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select defaultValue="credit-card">
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Débito Automático</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Assinante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}