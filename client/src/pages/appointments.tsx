import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Loader2 } from "lucide-react";
import AppointmentCalendar from "@/components/appointment-calendar";
import { format } from "date-fns";

// Extend the appointment schema with client validation
const appointmentFormSchema = z.object({
  clientId: z.string().or(z.number()).transform(val => Number(val)),
  staffId: z.string().or(z.number()).transform(val => Number(val)),
  serviceId: z.string().or(z.number()).transform(val => Number(val)),
  startTime: z.string(),
  endTime: z.string(),
  status: z.string(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: staff } = useQuery({
    queryKey: ['/api/staff'],
  });

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
  });

  // Create appointment form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: '',
      staffId: '',
      serviceId: '',
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      status: 'scheduled',
      notes: '',
    },
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      const response = await apiRequest('POST', '/api/appointments', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar agendamento. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Calculate end time based on service duration
  function calculateEndTime(serviceId: string, startTimeStr: string) {
    if (!serviceId || !startTimeStr) return;

    const service = services?.find((s: any) => s.id === Number(serviceId));
    if (!service) return;

    const startTime = new Date(startTimeStr);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + service.duration);

    form.setValue('endTime', format(endTime, "yyyy-MM-dd'T'HH:mm"));
  }

  // Handle form submission
  function onSubmit(values: AppointmentFormValues) {
    createAppointment.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gerenciamento de Agendamentos</h1>
          <p className="text-muted-foreground">Agende e gerencie consultas de clientes.</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Visualização em Calendário</TabsTrigger>
          <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <AppointmentCalendar />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <ListView />
        </TabsContent>
      </Tabs>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agendar Nova Consulta</DialogTitle>
            <DialogDescription>
              Crie um novo agendamento para um cliente.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.fullName}
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
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Update end time based on service duration
                        calculateEndTime(value, form.getValues('startTime'));
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services?.map((service: any) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name} ({service.duration} min)
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
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o profissional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff?.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.user?.fullName || `Staff #${s.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          onChange={(e) => {
                            field.onChange(e);
                            // Update end time when start time changes
                            calculateEndTime(form.getValues('serviceId'), e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Término</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="no-show">Não Compareceu</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Quaisquer notas ou instruções especiais"
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
                <Button type="submit" disabled={createAppointment.isPending}>
                  {createAppointment.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Agendar Consulta
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListView() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['/api/appointments'],
  });

  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: staff } = useQuery({
    queryKey: ['/api/staff'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Não há agendamentos cadastrados no sistema ainda. Crie um novo agendamento para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getClientName = (clientId: number) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client ? client.fullName : 'Unknown Client';
  };

  const getServiceName = (serviceId: number) => {
    const service = services?.find((s: any) => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const getStaffName = (staffId: number) => {
    const staffMember = staff?.find((s: any) => s.id === staffId);
    return staffMember?.user?.fullName || `Staff #${staffId}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'no-show':
        return 'Não Compareceu';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Sort appointments by date (newest first)
  const sortedAppointments = [...appointments].sort((a: any, b: any) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-7 p-4 font-medium border-b">
          <div className="col-span-2">Cliente</div>
          <div>Serviço</div>
          <div>Profissional</div>
          <div>Data & Hora</div>
          <div>Duração</div>
          <div>Status</div>
        </div>
        <div className="divide-y">
          {sortedAppointments.map((appointment: any) => {
            const startTime = new Date(appointment.startTime);
            const endTime = new Date(appointment.endTime);
            const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
            
            return (
              <div key={appointment.id} className="grid grid-cols-7 p-4 hover:bg-muted/50">
                <div className="col-span-2 font-medium">{getClientName(appointment.clientId)}</div>
                <div>{getServiceName(appointment.serviceId)}</div>
                <div>{getStaffName(appointment.staffId)}</div>
                <div>
                  <div>{format(startTime, 'MMM dd, yyyy')}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </div>
                </div>
                <div>{durationMinutes} min</div>
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
