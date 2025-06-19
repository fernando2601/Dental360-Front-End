import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Loader2, Gift, Award, Medal, Trophy, Tag, Percent, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ServiceCard from "@/components/service-card";
import { formatCurrency } from "@/lib/utils";

// Form schema for service
const serviceFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  duration: z.coerce.number().min(5, { message: "Duration must be at least 5 minutes." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function Services() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      duration: 30,
      price: 0,
      active: true,
    },
  });

  // Fetch services
  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  // Create service mutation
  const createService = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const response = await apiRequest('POST', '/api/services', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: ServiceFormValues) {
    createService.mutate(values);
  }

  // Get unique categories
  const categories = services
    ? ["all", ...new Set(services.map((service: any) => service.category))]
    : ["all"];

  // Filter services by category
  const filteredServices = services?.filter((service: any) => {
    return categoryFilter === "all" || service.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Serviços & Fidelização</h1>
          <p className="text-muted-foreground">Gerenciamento de serviços e programa de fidelidade da clínica.</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="loyalty">Programa de Fidelidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
              >
                {category === "all" ? "Todos" : category}
              </Button>
            ))}
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredServices || filteredServices.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="font-medium text-lg mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-6">
                {categoryFilter === "all" 
                  ? "Não há serviços cadastrados no sistema ainda." 
                  : `Não há serviços na categoria ${categoryFilter}.`}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="loyalty">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Medal className="mr-2 h-5 w-5 text-primary" />
                    Programa Smile
                  </CardTitle>
                  <CardDescription>Fidelização básica para novos pacientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pontos por visita:</span>
                      <Badge>10 pontos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pontos para resgatar:</span>
                      <Badge variant="outline">100 pontos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Benefício:</span>
                      <Badge variant="secondary">Limpeza grátis</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ideal para pacientes que visitam a clínica regularmente para consultas de rotina.
                    </p>
                    <Button variant="outline" className="w-full mt-2">
                      <Users className="mr-2 h-4 w-4" />
                      32 pacientes ativos
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Programa Premium
                  </CardTitle>
                  <CardDescription>Para pacientes de tratamentos estéticos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pontos por visita:</span>
                      <Badge>20 pontos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pontos por recomendação:</span>
                      <Badge>50 pontos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Benefício:</span>
                      <Badge variant="secondary">Desconto de 15%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Para pacientes que realizaram tratamentos estéticos ou harmonização facial.
                    </p>
                    <Button variant="outline" className="w-full mt-2">
                      <Users className="mr-2 h-4 w-4" />
                      18 pacientes ativos
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="mr-2 h-5 w-5 text-primary" />
                    Programa VIP
                  </CardTitle>
                  <CardDescription>Pacientes prioritários de alto valor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gasto mínimo anual:</span>
                      <Badge>{formatCurrency(10000)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto fixo:</span>
                      <Badge variant="secondary">10% em todos serviços</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Benefícios exclusivos:</span>
                      <Badge variant="outline">Horários prioritários</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pacientes que realizam múltiplos tratamentos de alto valor na clínica.
                    </p>
                    <Button variant="outline" className="w-full mt-2">
                      <Users className="mr-2 h-4 w-4" />
                      7 pacientes ativos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Análise de fidelização</CardTitle>
                <CardDescription>Métricas do programa de fidelidade e resgate de benefícios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center">
                      <Gift className="mr-2 h-4 w-4 text-primary" />
                      Total de resgates
                    </h4>
                    <div className="text-2xl font-bold">42</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Últimos 12 meses
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center">
                      <Percent className="mr-2 h-4 w-4 text-primary" />
                      Taxa de conversão
                    </h4>
                    <div className="text-2xl font-bold">68%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      De recomendações para clientes
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-primary" />
                      Valor médio descontado
                    </h4>
                    <div className="text-2xl font-bold">{formatCurrency(560)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Por cliente fidelizado
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Benefícios mais resgatados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="flex items-center">
                        <Gift className="mr-2 h-4 w-4 text-muted-foreground" />
                        Limpeza dental gratuita
                      </span>
                      <Badge>18 resgates</Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="flex items-center">
                        <Gift className="mr-2 h-4 w-4 text-muted-foreground" />
                        Desconto em harmonização
                      </span>
                      <Badge>14 resgates</Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="flex items-center">
                        <Gift className="mr-2 h-4 w-4 text-muted-foreground" />
                        Consulta de avaliação estética grátis
                      </span>
                      <Badge>10 resgates</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Serviço</DialogTitle>
            <DialogDescription>
              Adicione um novo serviço às ofertas da clínica.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Serviço</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Limpeza Dental" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Dental", "Aesthetic", "General", "Cosmetic", "Surgical"]
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detailed description of the service"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Disponibilizar este serviço para agendamento
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createService.isPending}>
                  {createService.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Service
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
