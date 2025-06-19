import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Phone, Users, MessageSquare, AlertCircle, QrCode, Clock, Settings } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface Message {
  id: number;
  phoneNumber: string;
  clientName: string;
  message: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed";
}

interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
}

export default function WhatsAppPage() {
  const [selectedTab, setSelectedTab] = useState("mensagens");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Mock data - seria substituído por dados reais da API
  const messages: Message[] = [
    {
      id: 1,
      phoneNumber: "+55 11 98765-4321",
      clientName: "Maria Silva",
      message: "Olá, gostaria de confirmar minha consulta amanhã às 14h.",
      timestamp: "2023-04-25T10:30:00",
      status: "read"
    },
    {
      id: 2,
      phoneNumber: "+55 11 91234-5678",
      clientName: "João Oliveira",
      message: "Bom dia, preciso remarcar minha consulta de hoje.",
      timestamp: "2023-04-25T09:15:00",
      status: "delivered"
    },
    {
      id: 3,
      phoneNumber: "+55 11 97777-8888",
      clientName: "Ana Pereira",
      message: "Qual o horário disponível para amanhã?",
      timestamp: "2023-04-25T08:45:00",
      status: "sent"
    }
  ];

  const templates: Template[] = [
    {
      id: 1,
      name: "Confirmação de Agendamento",
      content: "Olá, {{nome}}! Confirmando sua consulta para {{data}} às {{hora}}. Agradecemos a preferência. Responda com SIM para confirmar.",
      category: "Agendamentos"
    },
    {
      id: 2,
      name: "Lembrete de Consulta",
      content: "Olá, {{nome}}! Lembrando que você tem uma consulta amanhã às {{hora}}. Aguardamos sua presença!",
      category: "Agendamentos"
    },
    {
      id: 3,
      name: "Aniversário",
      content: "Parabéns, {{nome}}! A equipe da Clínica DentalSpa deseja um feliz aniversário e um ano repleto de sorrisos!",
      category: "Relacionamento"
    }
  ];

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleSendMessage = () => {
    if (message.trim() && phoneNumber.trim()) {
      // Aqui enviaríamos a mensagem via API WhatsApp
      alert(`Mensagem enviada para ${phoneNumber}: ${message}`);
      setMessage("");
      setPhoneNumber("");
    }
  };

  const handleUseTemplate = (template: Template) => {
    setMessage(template.content);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">Integração e mensagens via WhatsApp Business API.</p>
        </div>

        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Desconectar
            </Button>
          ) : (
            <Button onClick={handleConnect}>
              <FaWhatsapp className="mr-2 h-4 w-4" />
              Conectar WhatsApp
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Não conectado</AlertTitle>
          <AlertDescription>
            Conecte sua conta WhatsApp Business para começar a enviar e receber mensagens.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert>
          <FaWhatsapp className="h-4 w-4 text-green-500" />
          <AlertTitle>WhatsApp Conectado</AlertTitle>
          <AlertDescription>
            Sua conta WhatsApp Business está conectada e pronta para uso.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="mensagens">
            <MessageSquare className="mr-2 h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessageSquare className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campanhas">
            <Users className="mr-2 h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mensagens">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
                <CardDescription>Mensagens recentes enviadas e recebidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell>
                            <div className="font-medium">{msg.clientName}</div>
                            <div className="text-xs text-muted-foreground">{msg.phoneNumber}</div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                          <TableCell>{new Date(msg.timestamp).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              msg.status === 'read' ? 'bg-green-100 text-green-700' : 
                              msg.status === 'delivered' ? 'bg-blue-100 text-blue-700' : 
                              msg.status === 'sent' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {msg.status === 'read' ? 'Lido' : 
                              msg.status === 'delivered' ? 'Entregue' : 
                              msg.status === 'sent' ? 'Enviado' : 'Falha'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nova Mensagem</CardTitle>
                <CardDescription>Envie uma mensagem WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Número de Telefone</Label>
                  <Input 
                    id="phoneNumber"
                    placeholder="+55 11 98765-4321" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="message">Mensagem</Label>
                    <Select value={selectedTemplate} onValueChange={(value) => {
                      setSelectedTemplate(value);
                      const template = templates.find(t => t.id === parseInt(value));
                      if (template) handleUseTemplate(template);
                    }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea 
                    id="message"
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t px-6 py-4">
                <div></div>
                <Button onClick={handleSendMessage} disabled={!isConnected || !message.trim() || !phoneNumber.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{template.content}</p>
                </CardContent>
                <CardFooter className="justify-end border-t px-6 py-4">
                  <Button onClick={() => handleUseTemplate(template)} variant="secondary">
                    Usar Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campanhas">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas de Mensagens</CardTitle>
              <CardDescription>Envie mensagens programadas para grupos de clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-2">Criar Nova Campanha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input placeholder="Ex: Promoção de Limpeza - Abril" />
                  </div>
                  <div className="space-y-2">
                    <Label>Segmentação</Label>
                    <Select defaultValue="todos">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os clientes</SelectItem>
                        <SelectItem value="recentes">Clientes recentes</SelectItem>
                        <SelectItem value="inativos">Clientes inativos</SelectItem>
                        <SelectItem value="aniversariantes">Aniversariantes do mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Mensagem</Label>
                    <Textarea placeholder="Digite a mensagem da campanha..." className="min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Envio</Label>
                    <Input type="datetime-local" />
                  </div>
                  <div className="md:self-end">
                    <Button className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      Agendar Campanha
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do WhatsApp</CardTitle>
              <CardDescription>Gerencie as configurações da integração com WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-reply" className="flex flex-col space-y-1">
                  <span>Respostas Automáticas</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Habilitar respostas automáticas para mensagens recebidas
                  </span>
                </Label>
                <Switch
                  id="auto-reply"
                  checked={isAutoReplyEnabled}
                  onCheckedChange={setIsAutoReplyEnabled}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Número do WhatsApp Business</Label>
                <div className="flex items-center gap-2">
                  <Input placeholder="+55 11 98765-4321" disabled value="+55 11 98765-4321" />
                  <Button variant="outline" size="sm">
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="border p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-2">Status de Conexão</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>API conectada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Webhook configurado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Templates aprovados</span>
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-2">Chaves de API</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key WhatsApp Business</Label>
                    <Input type="password" value="••••••••••••••••" disabled />
                  </div>
                  <div className="md:self-end">
                    <Button variant="outline">
                      Gerenciar Chaves
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}