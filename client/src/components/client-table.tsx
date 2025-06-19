import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Trash2, EyeIcon, CheckCircle, XCircle } from "lucide-react";
import { formatDate, calculateAge, getDaysUntilBirthday } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ClientTableProps {
  clients: any[];
  isLoading: boolean;
}

// Form schema for client
const clientFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(5, { message: "Phone number is required." }),
  address: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientTable({ clients, isLoading }: ClientTableProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize edit form
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

  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      if (!selectedClient) return;
      const response = await apiRequest('PUT', `/api/clients/${selectedClient.id}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async () => {
      if (!selectedClient) return;
      const response = await apiRequest('DELETE', `/api/clients/${selectedClient.id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir paciente. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle view client
  function handleViewClient(client: any) {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  }

  // Handle edit client
  function handleEditClient(client: any) {
    setSelectedClient(client);
    form.reset({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      address: client.address || "",
      birthday: client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : "",
      notes: client.notes || "",
    });
    setIsEditDialogOpen(true);
  }

  // Handle delete client
  function handleDeleteClient(client: any) {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  }

  // Handle form submission
  function onSubmit(values: ClientFormValues) {
    updateClient.mutate(values);
  }

  // Check if birthday is coming up
  function isBirthdaySoon(birthdayStr: string) {
    if (!birthdayStr) return false;
    const days = getDaysUntilBirthday(birthdayStr);
    return days !== null && days <= 14;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="font-medium text-lg mb-2">Nenhum paciente encontrado</h3>
        <p className="text-muted-foreground mb-6">
          Não há pacientes no sistema ainda ou nenhum corresponde aos critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead className="hidden md:table-cell">Data de Nasc.</TableHead>
            <TableHead className="hidden md:table-cell">Endereço</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="font-medium">{client.fullName}</div>
                {client.notes && client.notes.includes("Instagram:") && (
                  <div className="text-xs text-primary mt-1">
                    {client.notes.match(/Instagram: (@[^\s.,]+)/)?.[1] || ""}
                  </div>
                )}
                {client.notes && client.notes.includes("Frequência:") && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Freq:</span> {client.notes.match(/Frequência: ([^.,]+)/)?.[1].trim() || ""}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{client.email}</span>
                  <span className="text-muted-foreground text-sm">{client.phone}</span>
                  {client.notes && client.notes.includes("Cliente desde:") && (
                    <span className="text-xs text-muted-foreground">
                      Desde: {client.notes.match(/Cliente desde: ([^.,]+)/)?.[1].trim() || ""}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {client.birthday ? (
                  <div className="flex flex-col">
                    <span>{formatDate(client.birthday)}</span>
                    <span className={`text-sm ${isBirthdaySoon(client.birthday) ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {calculateAge(client.birthday)} anos
                      {isBirthdaySoon(client.birthday) && (
                        <span className="ml-1">
                          (Aniversário próximo!)
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Não fornecido</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {client.address || <span className="text-muted-foreground">Não fornecido</span>}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}>
                    <EyeIcon className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Client Dialog */}
      {selectedClient && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedClient.fullName}</DialogTitle>
              <DialogDescription>
                Detalhes e informações do paciente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p>{selectedClient.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Telefone</h4>
                  <p>{selectedClient.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Endereço</h4>
                <p>{selectedClient.address || "Não fornecido"}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Nascimento</h4>
                {selectedClient.birthday ? (
                  <div>
                    <p>{formatDate(selectedClient.birthday)}</p>
                    <p className="text-sm text-muted-foreground">
                      Idade: {calculateAge(selectedClient.birthday)} anos
                      {isBirthdaySoon(selectedClient.birthday) && (
                        <span className="ml-2 text-primary font-medium">
                          (Aniversário em {getDaysUntilBirthday(selectedClient.birthday)} dias)
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p>Não fornecido</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                <p className="whitespace-pre-wrap">{selectedClient.notes || "Sem observações"}</p>
                
                {/* Informações extraídas das notas */}
                {selectedClient.notes && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                    {selectedClient.notes.includes("Instagram:") && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Instagram:</span>
                        <span className="text-primary font-medium">
                          {selectedClient.notes.match(/Instagram: (@[^\s.,]+)/)?.[1]}
                        </span>
                      </div>
                    )}
                    
                    {selectedClient.notes.includes("Frequência:") && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Frequência:</span>
                        <span>
                          {selectedClient.notes.match(/Frequência: ([^.,]+)/)?.[1].trim()}
                        </span>
                      </div>
                    )}
                    
                    {selectedClient.notes.includes("Cliente desde:") && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Cliente desde:</span>
                        <span>
                          {selectedClient.notes.match(/Cliente desde: ([^.,]+)/)?.[1].trim()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEditClient(selectedClient);
              }}>
                Editar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Client Dialog */}
      {selectedClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>
                Atualize as informações do paciente abaixo.
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
                        <Input {...field} />
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
                          <Input {...field} type="email" />
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
                          <Input {...field} />
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
                        <Input {...field} />
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
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateClient.isPending}>
                    {updateClient.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedClient && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <span className="font-medium">{selectedClient.fullName}</span>?
                Esta ação não pode ser desfeita e removerá todos os dados do paciente do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteClient.mutate()}
                disabled={deleteClient.isPending}
              >
                {deleteClient.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
