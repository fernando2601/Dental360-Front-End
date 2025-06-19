import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download, ArrowUpDown, Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import InventoryTable from "@/components/inventory-table";
import * as XLSX from 'xlsx';

// Form schema for inventory item
const inventoryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Quantity must be a non-negative number." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  threshold: z.coerce.number().min(0, { message: "Threshold must be a non-negative number." }),
  price: z.coerce.number().min(0, { message: "Price must be a non-negative number." }),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function Inventory() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      quantity: 0,
      unit: "",
      threshold: 0,
      price: 0,
    },
  });

  // Fetch inventory items
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['/api/inventory'],
  });

  // Create inventory item mutation
  const createInventoryItem = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      const response = await apiRequest('POST', '/api/inventory', {
        ...values,
        lastRestocked: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Item adicionado ao estoque com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar item ao estoque. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: InventoryFormValues) {
    createInventoryItem.mutate(values);
  }

  // Get unique categories for filter
  const categories = inventory
    ? ["all", ...new Set(inventory.map((item: any) => item.category))]
    : ["all"];

  // Filter inventory items
  const filteredInventory = inventory?.filter((item: any) => {
    // Filter by category
    const categoryMatch = categoryFilter === "all" || item.category === categoryFilter;
    
    // Filter by search query
    const searchMatch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  // Export inventory as XLSX (Excel)
  function exportInventory() {
    if (!inventory || inventory.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há itens no estoque para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Formatar data para visualização
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Formatar preço para visualização
    const formatPrice = (price: number | string | null | undefined) => {
      if (price === null || price === undefined) return "R$ 0,00";
      
      // Converter para número se for string
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      // Formatar como moeda brasileira
      return numericPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };

    // Preparar dados para exportação
    const worksheetData = inventory.map((item: any) => ({
      'Nome do Item': item.name,
      'Categoria': item.category,
      'Descrição': item.description || '',
      'Quantidade': item.quantity,
      'Unidade': item.unit,
      'Limite para Reposição': item.threshold,
      'Preço': formatPrice(item.price),
      'Preço (Valor)': typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      'Última Reposição': formatDate(item.lastRestocked),
      'Status': item.quantity <= item.threshold ? "Necessita Reposição" : "Estoque Adequado"
    }));

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Definir larguras das colunas (em caracteres)
    const columnWidths = [
      { wch: 25 }, // Nome do Item
      { wch: 15 }, // Categoria
      { wch: 35 }, // Descrição
      { wch: 12 }, // Quantidade
      { wch: 15 }, // Unidade
      { wch: 20 }, // Limite para Reposição
      { wch: 15 }, // Preço
      { wch: 15 }, // Preço (Valor)
      { wch: 20 }, // Última Reposição
      { wch: 20 }  // Status
    ];
    worksheet['!cols'] = columnWidths;

    // Configurar estilos e cores (limitado no XLSX)
    // Observe que o xlsx básico tem suporte limitado para formatação

    // Criar workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário");

    // Exportar para arquivo Excel
    XLSX.writeFile(workbook, "Inventario_DentalSPA.xlsx");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciamento de Estoque</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os itens de estoque da sua clínica.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full sm:w-auto">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
          <Button variant="outline" onClick={exportInventory}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens no estoque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categorias</SelectLabel>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Todas as Categorias" : category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <InventoryTable 
        inventory={filteredInventory || []} 
        isLoading={isLoading} 
      />

      {/* Create Inventory Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item ao Estoque</DialogTitle>
            <DialogDescription>
              Insira os detalhes do novo item de estoque.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Item</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Botox" />
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
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Injetáveis" />
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
                      <Input {...field} placeholder="Toxina botulínica para redução de rugas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="unidades" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite para Reposição</FormLabel>
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
                      <FormLabel>Preço Unitário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createInventoryItem.isPending}>
                  {createInventoryItem.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
