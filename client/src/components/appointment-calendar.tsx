import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Definição da localização portuguesa para o calendário
const ptBrLocale = {
  code: 'pt-br',
  week: {
    dow: 0, // Domingo como primeiro dia da semana
    doy: 4, // A semana que contém Jan 4 é a primeira semana do ano
  },
  buttonText: {
    prev: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    list: 'Lista',
  },
  weekText: 'Sm',
  allDayText: 'Todo o dia',
  moreLinkText: 'mais',
  noEventsText: 'Sem eventos para mostrar',
  dayHeaderFormat: { weekday: 'long' },
  weekdays: {
    shorthand: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    longhand: [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ],
  },
  months: {
    shorthand: [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ],
    longhand: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
  },
};
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAppointmentSchema } from "@shared/schema";

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

export function AppointmentCalendar() {
  const [calendarApi, setCalendarApi] = useState<Calendar | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: staff, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['/api/staff'],
  });

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
  });

  // Create appointment form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: '',
      staffId: '',
      serviceId: '',
      startTime: '',
      endTime: '',
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
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize calendar after data is loaded
  useEffect(() => {
    if (
      !isLoadingAppointments &&
      !isLoadingClients &&
      !isLoadingStaff &&
      !isLoadingServices &&
      !calendarApi &&
      appointments
    ) {
      const calendarEl = document.getElementById('calendar');
      if (!calendarEl) return;

      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        locale: ptBrLocale,
        headerToolbar: {
          left: 'prev,next hoje',
          center: 'title',
          right: 'viewMenu',
        },
        buttonText: {
          today: 'Hoje',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
        },
        titleFormat: { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        },
        customButtons: {
          viewMenu: {
            text: '📅 Semana',
            click: function() {
              const customDropdown = document.getElementById('view-dropdown');
              if (customDropdown) {
                customDropdown.classList.toggle('hidden');
              }
            }
          }
        },
        slotMinTime: '07:00:00',
        slotMaxTime: '20:00:00',
        allDaySlot: false,
        height: 'auto',
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true },
        // Personalizações de estilo
        dayCellClassNames: 'rounded-md bg-slate-50/50',
        slotLabelClassNames: 'text-sm font-medium text-slate-500',
        events: appointments.map((appointment: any) => {
          const client = clients?.find((c: any) => c.id === appointment.clientId);
          const service = services?.find((s: any) => s.id === appointment.serviceId);
          const staff = staff?.find((s: any) => s.id === appointment.staffId);
          
          return {
            id: appointment.id.toString(),
            title: client?.fullName || 'Cliente',
            start: appointment.startTime,
            end: appointment.endTime,
            backgroundColor: getStatusColor(appointment.status),
            borderColor: getStatusColor(appointment.status),
            textColor: '#ffffff',
            classNames: 'rounded-md shadow-sm',
            extendedProps: {
              clientId: appointment.clientId,
              staffId: appointment.staffId,
              serviceId: appointment.serviceId,
              status: appointment.status,
              notes: appointment.notes,
              clientName: client?.fullName,
              serviceName: service?.name,
              staffName: staff?.user?.fullName || `Profissional #${appointment.staffId}`,
            },
          };
        }),
        eventContent: function(arg) {
          const timeText = arg.timeText;
          const title = arg.event.title;
          const serviceName = arg.event.extendedProps.serviceName;
          
          return { 
            html: `
              <div class="p-1">
                <div class="text-xs font-semibold">${timeText}</div>
                <div class="text-sm font-medium">${title}</div>
                ${serviceName ? `<div class="text-xs opacity-90">${serviceName}</div>` : ''}
              </div>
            `
          };
        },
        select: (info) => {
          // Handle date selection - open appointment form
          setSelectedDate(info.start);
          const endTime = new Date(info.start);
          endTime.setMinutes(endTime.getMinutes() + 60); // Default 1-hour appointment
          
          form.setValue('startTime', formatDateTimeForInput(info.start));
          form.setValue('endTime', formatDateTimeForInput(endTime));
          
          setIsDialogOpen(true);
        },
        eventClick: (info) => {
          // Handle event click - open appointment details
          console.log('Event clicked:', info.event);
          // Implement appointment details view
        },
      });

      calendar.render();
      setCalendarApi(calendar);

      return () => {
        calendar.destroy();
      };
    }
  }, [appointments, isLoadingAppointments, isLoadingClients, isLoadingStaff, isLoadingServices]);

  // Format date for datetime-local input
  function formatDateTimeForInput(date: Date) {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  }

  // Get appointment title
  function getAppointmentTitle(appointment: any) {
    const client = clients?.find((c: any) => c.id === appointment.clientId);
    const service = services?.find((s: any) => s.id === appointment.serviceId);
    
    return `${client?.fullName || 'Cliente'}`;
  }

  // Get status color
  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled':
        return '#60a5fa'; // Azul claro vibrante
      case 'in-progress':
        return '#f43f5e'; // Vermelho forte - indicador em andamento
      case 'completed':
        return '#34d399'; // Verde vibrante  
      case 'cancelled':
        return '#f87171'; // Vermelho suave
      case 'no-show':
        return '#fbbf24'; // Amarelo âmbar
      default:
        return '#9CA3AF';
    }
  }

  // Calculate end time based on service duration
  function calculateEndTime(serviceId: string, startTimeStr: string) {
    if (!serviceId || !startTimeStr) return;

    const service = services?.find((s: any) => s.id === Number(serviceId));
    if (!service) return;

    const startTime = new Date(startTimeStr);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + service.duration);

    form.setValue('endTime', formatDateTimeForInput(endTime));
  }

  // Handle form submission
  function onSubmit(values: AppointmentFormValues) {
    createAppointment.mutate(values);
  }

  const isLoading = isLoadingAppointments || isLoadingClients || isLoadingStaff || isLoadingServices;

  const handleViewChange = (view: string) => {
    if (calendarApi) {
      calendarApi.changeView(view);
      
      // Atualizar o texto do botão dropdown
      let buttonText = 'Semana';
      if (view === 'dayGridMonth') buttonText = 'Mês';
      else if (view === 'timeGridDay') buttonText = 'Dia';
      
      const viewButton = document.querySelector('.fc-viewMenu-button');
      if (viewButton) {
        viewButton.textContent = `📅 ${buttonText}`;
      }
      
      // Esconder o dropdown
      const dropdown = document.getElementById('view-dropdown');
      if (dropdown) {
        dropdown.classList.add('hidden');
      }
    }
  };

  return (
    <Card className="col-span-full shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">Calendário de Agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative">
            {/* Dropdown de seleção de visualização */}
            <div 
              id="view-dropdown" 
              className="absolute hidden right-0 top-12 z-10 bg-white shadow-lg rounded-md overflow-hidden border"
            >
              <ul className="py-1">
                <li 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  Mês
                </li>
                <li 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleViewChange('timeGridWeek')}
                >
                  Semana
                </li>
                <li 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleViewChange('timeGridDay')}
                >
                  Dia
                </li>
              </ul>
            </div>
            <div id="calendar" className="h-[700px] p-2 calendar-custom" />
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
              <DialogDescription>
                {selectedDate && `Criando agendamento para ${format(selectedDate, 'MMMM d, yyyy')}`}
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
                              {s.user?.fullName || `Profissional #${s.id}`}
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
                          <SelectItem value="in-progress">Em Andamento</SelectItem>
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
                          placeholder="Instruções ou observações especiais"
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
                    onClick={() => setIsDialogOpen(false)}
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
      </CardContent>
    </Card>
  );
}

export default AppointmentCalendar;
