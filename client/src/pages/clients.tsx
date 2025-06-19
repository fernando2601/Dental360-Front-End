import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Download, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import ClientTable from "@/components/client-table";
import * as XLSX from 'xlsx';

// Form schema for client
const clientFormSchema = z.object({
  fullName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido." }),
  phone: z.string().min(5, { message: "Número de telefone é obrigatório." }),
  address: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      birthday: "",
      notes: "",
    },
  });

  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const response = await apiRequest('POST', '/api/clients', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Filter clients based on search query with enhanced search
  const filteredClients = clients?.filter((client: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Extrair informações das notas para busca
    let instagram = "";
    let frequencia = "";
    let clienteDesde = "";
    
    if (client.notes) {
      // Extrair Instagram
      const instagramMatch = client.notes.match(/Instagram: (@[^\s.,]+)/);
      if (instagramMatch) {
        instagram = instagramMatch[1].toLowerCase();
      }
      
      // Extrair Frequência
      const frequenciaMatch = client.notes.match(/Frequência: ([^.,]+)/);
      if (frequenciaMatch) {
        frequencia = frequenciaMatch[1].trim().toLowerCase();
      }
      
      // Extrair Cliente desde
      const clienteDesdeMatch = client.notes.match(/Cliente desde: ([^.,]+)/);
      if (clienteDesdeMatch) {
        clienteDesde = clienteDesdeMatch[1].trim().toLowerCase();
      }
    }
    
    return (
      client.fullName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query) ||
      (client.address && client.address.toLowerCase().includes(query)) ||
      (client.birthday && client.birthday.toLowerCase().includes(query)) ||
      (client.notes && client.notes.toLowerCase().includes(query)) ||
      instagram.includes(query) ||
      frequencia.includes(query) ||
      clienteDesde.includes(query)
    );
  });

  // Handle form submission
  function onSubmit(values: ClientFormValues) {
    createClient.mutate(values);
  }

  // Export clients as Excel (XLSX)
  function exportClients() {
    if (!clients || clients.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há pacientes para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Formatar data para visualização
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "";
      // Verifica se a data está no formato ISO ou apenas data
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('pt-BR');
    };

    // Extrair informações adicionais das notas e formatar adequadamente
    const processedClients = clients.map((client: any) => {
      // Extrair informações das notas
      let instagram = "";
      let frequencia = "";
      let clienteDesde = "";
      let alergias = "";
      let preferencias = "";
      
      if (client.notes) {
        // Extrair Instagram
        const instagramMatch = client.notes.match(/Instagram: (@[^\s.,]+)/);
        if (instagramMatch) {
          instagram = instagramMatch[1];
        }
        
        // Extrair Frequência
        const frequenciaMatch = client.notes.match(/Frequência: ([^.,]+)/);
        if (frequenciaMatch) {
          frequencia = frequenciaMatch[1].trim();
        }
        
        // Extrair Cliente desde
        const clienteDesdeMatch = client.notes.match(/Cliente desde: ([^.,]+)/);
        if (clienteDesdeMatch) {
          clienteDesde = clienteDesdeMatch[1].trim();
        }

        // Extrair Alergias
        const alergiasMatch = client.notes.match(/Alérgico a ([^.]+)/);
        if (alergiasMatch) {
          alergias = alergiasMatch[1].trim();
        }

        // Extrair Preferências
        const preferenciaMatch = client.notes.match(/Prefere ([^.]+)/);
        if (preferenciaMatch) {
          preferencias = preferenciaMatch[1].trim();
        }
      }
      
      // Calcular idade a partir da data de nascimento, se disponível
      let idade = "";
      if (client.birthday) {
        const birthDate = new Date(client.birthday);
        const today = new Date();
        if (!isNaN(birthDate.getTime())) {
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          
          idade = calculatedAge.toString();
        }
      }

      // Criar objeto com dados processados
      return {
        'Nome Completo': client.fullName,
        'Email': client.email,
        'Telefone': client.phone,
        'Endereço': client.address || '',
        'Data de Nascimento': formatDate(client.birthday),
        'Idade': idade,
        'Instagram': instagram,
        'Frequência de Visita': frequencia,
        'Cliente Desde': clienteDesde,
        'Alergias': alergias,
        'Preferências': preferencias,
        'Data de Cadastro': formatDate(client.createdAt),
        'Observações Completas': client.notes || ''
      };
    });

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(processedClients);
    
    // Definir larguras das colunas (em caracteres)
    const columnWidths = [
      { wch: 25 }, // Nome Completo
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 35 }, // Endereço
      { wch: 15 }, // Data de Nascimento
      { wch: 8 },  // Idade
      { wch: 15 }, // Instagram
      { wch: 15 }, // Frequência de Visita
      { wch: 15 }, // Cliente Desde
      { wch: 25 }, // Alergias
      { wch: 25 }, // Preferências
      { wch: 15 }, // Data de Cadastro
      { wch: 60 }  // Observações Completas
    ];
    worksheet['!cols'] = columnWidths;

    // Criar workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");

    // Criar segunda planilha com estatísticas
    const estatisticas = [
      { 'Estatística': 'Total de Pacientes', 'Valor': processedClients.length },
      { 'Estatística': 'Pacientes com Instagram', 'Valor': processedClients.filter(c => c.Instagram).length },
      { 'Estatística': 'Frequência mais comum', 'Valor': getMostCommon(processedClients.map(c => c['Frequência de Visita']).filter(Boolean)) }
    ];
    
    const estatisticasSheet = XLSX.utils.json_to_sheet(estatisticas);
    estatisticasSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, estatisticasSheet, "Estatísticas");

    // Exportar para arquivo Excel
    XLSX.writeFile(workbook, "Pacientes_DentalSPA.xlsx");
  }
  
  // Função auxiliar para encontrar o valor mais comum em um array
  function getMostCommon(arr: string[]): string {
    if (arr.length === 0) return "N/A";
    
    const frequency: {[key: string]: number} = {};
    let maxFreq = 0;
    let mostCommon = "";
    
    for (const item of arr) {
      frequency[item] = (frequency[item] || 0) + 1;
      
      if (frequency[item] > maxFreq) {
        maxFreq = frequency[item];
        mostCommon = item;
      }
    }
    
    return mostCommon || "N/A";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciamento de Pacientes</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe todos os pacientes da sua clínica.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo Paciente
          </Button>
          <Button variant="outline" onClick={exportClients}>
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
            placeholder="Buscar por nome, email, telefone, Instagram, frequência..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Busque por qualquer informação: nome, contato, endereço, frequência, Instagram, data de registro, etc.
          </p>
        </div>
      </div>

      {/* Clients table */}
      <ClientTable 
        clients={filteredClients || []} 
        isLoading={isLoading} 
      />

      {/* Create Client Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            <DialogDescription>
              Insira os dados do paciente para criar um novo cadastro.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="João Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="joao@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 98765-4321" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua Exemplo, 123, Bairro, Cidade, Estado, CEP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Informações adicionais sobre o paciente"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Paciente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
