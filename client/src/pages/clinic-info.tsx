import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Phone, Mail, Clock, CalendarDays, Plus, Trash2, Save } from "lucide-react";
import { FaInstagram, FaFacebook, FaYoutube, FaGoogle } from "react-icons/fa";

interface ClinicInfo {
  name: string;
  cnpj: string;
  address: {
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
  };
  socialMedia: {
    instagram: string;
    facebook: string;
    youtube: string;
    google: string;
  };
  businessHours: {
    id: number;
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  legalInfo: {
    responsibleName: string;
    responsibleId: string;
    professionalLicense: string;
  };
}

export default function ClinicInfoPage() {
  // Mock data - seria substituído por dados reais da API
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    name: "Clínica Odontológica DentalSpa",
    cnpj: "12.345.678/0001-90",
    address: {
      street: "Avenida Paulista",
      number: "1578",
      complement: "Sala 502",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      postalCode: "01310-200"
    },
    contact: {
      phone: "(11) 3456-7890",
      whatsapp: "(11) 98765-4321",
      email: "contato@dentalspa.com.br",
      website: "www.clinicadentalspa.com.br"
    },
    socialMedia: {
      instagram: "@clinicadentalspa",
      facebook: "clinicadentalspa",
      youtube: "channel/clinicadentalspa",
      google: "DentalSpa"
    },
    businessHours: [
      { id: 1, day: "Segunda-feira", openTime: "08:00", closeTime: "18:00", isClosed: false },
      { id: 2, day: "Terça-feira", openTime: "08:00", closeTime: "18:00", isClosed: false },
      { id: 3, day: "Quarta-feira", openTime: "08:00", closeTime: "18:00", isClosed: false },
      { id: 4, day: "Quinta-feira", openTime: "08:00", closeTime: "18:00", isClosed: false },
      { id: 5, day: "Sexta-feira", openTime: "08:00", closeTime: "18:00", isClosed: false },
      { id: 6, day: "Sábado", openTime: "08:00", closeTime: "12:00", isClosed: false },
      { id: 7, day: "Domingo", openTime: "00:00", closeTime: "00:00", isClosed: true }
    ],
    legalInfo: {
      responsibleName: "Dra. Ana Carolina Souza",
      responsibleId: "123.456.789-00",
      professionalLicense: "CRO-SP 12345"
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ClinicInfo>(clinicInfo);

  const handleStartEditing = () => {
    setFormData(clinicInfo);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setClinicInfo(formData);
    setIsEditing(false);
    // Aqui enviaríamos os dados para a API
    alert("Informações da clínica salvas com sucesso!");
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => {
      if (section === 'root') {
        return { ...prev, [field]: value };
      }
      
      // Create a fresh copy of the form data
      const newFormData = JSON.parse(JSON.stringify(prev)) as ClinicInfo;
      
      // Type assertion to access the section as any to allow property access
      const sectionObj = newFormData[section as keyof ClinicInfo] as any;
      
      if (sectionObj && typeof sectionObj === 'object') {
        // Update the field in the section
        sectionObj[field] = value;
      }
      
      return newFormData;
    });
  };

  const handleBusinessHoursChange = (id: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedHours = prev.businessHours.map(hour => {
        if (hour.id === id) {
          return { ...hour, [field]: value };
        }
        return hour;
      });
      return { ...prev, businessHours: updatedHours };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dados da Clínica</h1>
          <p className="text-muted-foreground">Gerencie as informações da sua clínica odontológica.</p>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </>
          ) : (
            <Button onClick={handleStartEditing}>
              Editar Informações
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="informacoes-basicas" className="w-full">
        <TabsList className="mb-4 overflow-x-auto flex-nowrap">
          <TabsTrigger value="informacoes-basicas">
            <Building className="mr-2 h-4 w-4" />
            Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="endereco">
            <MapPin className="mr-2 h-4 w-4" />
            Endereço
          </TabsTrigger>
          <TabsTrigger value="contato">
            <Phone className="mr-2 h-4 w-4" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="horarios">
            <Clock className="mr-2 h-4 w-4" />
            Horários de Funcionamento
          </TabsTrigger>
          <TabsTrigger value="legal">
            <CalendarDays className="mr-2 h-4 w-4" />
            Informações Legais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes-basicas">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados básicos da clínica para identificação e registro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nome da Clínica</Label>
                  {isEditing ? (
                    <Input 
                      id="clinic-name" 
                      value={formData.name} 
                      onChange={(e) => handleInputChange('root', 'name', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  {isEditing ? (
                    <Input 
                      id="cnpj" 
                      value={formData.cnpj} 
                      onChange={(e) => handleInputChange('root', 'cnpj', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.cnpj}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Redes Sociais</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FaInstagram className="h-5 w-5 text-pink-600" />
                    {isEditing ? (
                      <Input 
                        placeholder="Instagram" 
                        value={formData.socialMedia.instagram} 
                        onChange={(e) => handleInputChange('socialMedia', 'instagram', e.target.value)}
                      />
                    ) : (
                      <div className="p-2 rounded-md bg-muted w-full">
                        {clinicInfo.socialMedia.instagram}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaFacebook className="h-5 w-5 text-blue-600" />
                    {isEditing ? (
                      <Input 
                        placeholder="Facebook" 
                        value={formData.socialMedia.facebook} 
                        onChange={(e) => handleInputChange('socialMedia', 'facebook', e.target.value)}
                      />
                    ) : (
                      <div className="p-2 rounded-md bg-muted w-full">
                        {clinicInfo.socialMedia.facebook}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaYoutube className="h-5 w-5 text-red-600" />
                    {isEditing ? (
                      <Input 
                        placeholder="Youtube" 
                        value={formData.socialMedia.youtube} 
                        onChange={(e) => handleInputChange('socialMedia', 'youtube', e.target.value)}
                      />
                    ) : (
                      <div className="p-2 rounded-md bg-muted w-full">
                        {clinicInfo.socialMedia.youtube}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGoogle className="h-5 w-5 text-blue-500" />
                    {isEditing ? (
                      <Input 
                        placeholder="Google Business" 
                        value={formData.socialMedia.google} 
                        onChange={(e) => handleInputChange('socialMedia', 'google', e.target.value)}
                      />
                    ) : (
                      <div className="p-2 rounded-md bg-muted w-full">
                        {clinicInfo.socialMedia.google}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endereco">
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização física da clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Logradouro</Label>
                  {isEditing ? (
                    <Input 
                      id="street" 
                      value={formData.address.street} 
                      onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.street}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  {isEditing ? (
                    <Input 
                      id="number" 
                      value={formData.address.number} 
                      onChange={(e) => handleInputChange('address', 'number', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.number}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  {isEditing ? (
                    <Input 
                      id="complement" 
                      value={formData.address.complement} 
                      onChange={(e) => handleInputChange('address', 'complement', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.complement}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">Bairro</Label>
                  {isEditing ? (
                    <Input 
                      id="district" 
                      value={formData.address.district} 
                      onChange={(e) => handleInputChange('address', 'district', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.district}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  {isEditing ? (
                    <Input 
                      id="city" 
                      value={formData.address.city} 
                      onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.city}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  {isEditing ? (
                    <Select 
                      value={formData.address.state} 
                      onValueChange={(value) => handleInputChange('address', 'state', value)}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="AL">AL</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="MA">MA</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="PB">PB</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="PI">PI</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="RO">RO</SelectItem>
                        <SelectItem value="RR">RR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="SE">SE</SelectItem>
                        <SelectItem value="TO">TO</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.state}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal-code">CEP</Label>
                  {isEditing ? (
                    <Input 
                      id="postal-code" 
                      value={formData.address.postalCode} 
                      onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.address.postalCode}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contato">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>Canais de comunicação para clientes e parceiros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  {isEditing ? (
                    <Input 
                      id="phone" 
                      value={formData.contact.phone} 
                      onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.contact.phone}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  {isEditing ? (
                    <Input 
                      id="whatsapp" 
                      value={formData.contact.whatsapp} 
                      onChange={(e) => handleInputChange('contact', 'whatsapp', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.contact.whatsapp}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  {isEditing ? (
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.contact.email} 
                      onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.contact.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  {isEditing ? (
                    <Input 
                      id="website" 
                      value={formData.contact.website} 
                      onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.contact.website}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>Horários em que a clínica está aberta para atendimento.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia da Semana</TableHead>
                    <TableHead>Horário de Abertura</TableHead>
                    <TableHead>Horário de Fechamento</TableHead>
                    <TableHead>Fechado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.businessHours.map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell className="font-medium">{hour.day}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            type="time" 
                            value={hour.openTime} 
                            onChange={(e) => handleBusinessHoursChange(hour.id, 'openTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        ) : (
                          hour.isClosed ? "Fechado" : hour.openTime
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            type="time" 
                            value={hour.closeTime} 
                            onChange={(e) => handleBusinessHoursChange(hour.id, 'closeTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        ) : (
                          hour.isClosed ? "Fechado" : hour.closeTime
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Switch 
                            checked={hour.isClosed}
                            onCheckedChange={(checked) => handleBusinessHoursChange(hour.id, 'isClosed', checked)}
                          />
                        ) : (
                          hour.isClosed ? "Sim" : "Não"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Legais</CardTitle>
              <CardDescription>Informações do responsável técnico e documentação legal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible-name">Nome do Responsável Técnico</Label>
                  {isEditing ? (
                    <Input 
                      id="responsible-name" 
                      value={formData.legalInfo.responsibleName} 
                      onChange={(e) => handleInputChange('legalInfo', 'responsibleName', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.legalInfo.responsibleName}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible-id">CPF do Responsável</Label>
                  {isEditing ? (
                    <Input 
                      id="responsible-id" 
                      value={formData.legalInfo.responsibleId} 
                      onChange={(e) => handleInputChange('legalInfo', 'responsibleId', e.target.value)}
                    />
                  ) : (
                    <div className="p-2 rounded-md bg-muted">
                      {clinicInfo.legalInfo.responsibleId}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional-license">Registro Profissional</Label>
                {isEditing ? (
                  <Input 
                    id="professional-license" 
                    value={formData.legalInfo.professionalLicense} 
                    onChange={(e) => handleInputChange('legalInfo', 'professionalLicense', e.target.value)}
                  />
                ) : (
                  <div className="p-2 rounded-md bg-muted">
                    {clinicInfo.legalInfo.professionalLicense}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}