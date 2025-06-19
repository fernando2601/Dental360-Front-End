import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardStats from "@/components/dashboard-stats";
import AppointmentCalendar from "@/components/appointment-calendar";
import FinanceChart from "@/components/finance-chart";
import { CalendarDays, Users, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { formatDate, getDaysUntilBirthday } from "@/lib/utils";

// Definindo tipos simplificados
interface Client {
  id: number;
  fullName: string;
  birthday: string;
}

interface Appointment {
  id: number;
  clientId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
}

export default function Dashboard() {
  // Fetch clients for birthday reminders
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch upcoming appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Get upcoming birthdays
  const upcomingBirthdays = clients.filter((client: Client) => {
    const daysUntil = getDaysUntilBirthday(client.birthday);
    return daysUntil !== null && daysUntil <= 14; // Upcoming in next 14 days
  }).sort((a: Client, b: Client) => {
    const daysA = getDaysUntilBirthday(a.birthday) || 0;
    const daysB = getDaysUntilBirthday(b.birthday) || 0;
    return daysA - daysB;
  });

  // Get today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todaysAppointments = appointments.filter((appt: Appointment) => {
    const apptDate = new Date(appt.startTime);
    return apptDate >= today && apptDate < tomorrow;
  }).sort((a: Appointment, b: Appointment) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de gerenciamento da sua clínica.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Link href="/appointments">
            <Button>
              <CalendarDays className="mr-2 h-4 w-4" />
              Agendamentos
            </Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </Button>
          </Link>
        </div>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agendamentos de Hoje */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agendamentos de Hoje</CardTitle>
              <CardDescription>
                {todaysAppointments.length} agendamentos marcados
              </CardDescription>
            </div>
            <Link href="/appointments">
              <Button variant="outline" size="sm">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Sem agendamentos hoje</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Não há agendamentos marcados para hoje.
                </p>
                <Link href="/appointments">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar Consulta
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysAppointments.slice(0, 5).map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{appointment.clientId}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm">{appointment.serviceId}</span>
                      <span className="block text-xs text-muted-foreground">{appointment.staffId}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aniversários Próximos */}
        <Card>
          <CardHeader>
            <CardTitle>Aniversários Próximos</CardTitle>
            <CardDescription>Lembretes de aniversários dos pacientes</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Sem aniversários próximos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum aniversário de paciente nos próximos 14 dias.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBirthdays.slice(0, 5).map((client: any) => {
                  const daysUntil = getDaysUntilBirthday(client.birthday);
                  return (
                    <div key={client.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{client.fullName}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(client.birthday)}
                        </span>
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {daysUntil === 0 ? "Hoje" : daysUntil === 1 ? "Amanhã" : `${daysUntil} dias`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="appointments">Calendário de Agendamentos</TabsTrigger>
          <TabsTrigger value="finances">Visão Financeira</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <AppointmentCalendar />
        </TabsContent>
        <TabsContent value="finances">
          <FinanceChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
