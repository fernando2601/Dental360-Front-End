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
import { Badge } from "@/components/ui/badge";
import { Gift, Plus, Trash2, Edit, Check, X } from "lucide-react";

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  services: {
    id: number;
    name: string;
    price: number;
  }[];
  duration: number; // Em minutos
  validityPeriod: number; // Em dias
  isActive: boolean;
}

export default function PackagesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  // Mock data - seria substituído por dados reais da API
  const packages: ServicePackage[] = [
    {
      id: 1,
      name: "Pacote Clareamento Premium",
      description: "Inclui clareamento a laser e limpeza dental profissional",
      price: 850,
      discountPercentage: 15,
      services: [
        { id: 1, name: "Clareamento a Laser", price: 800 },
        { id: 2, name: "Limpeza Dental Profissional", price: 200 }
      ],
      duration: 120,
      validityPeriod: 30,
      isActive: true
    },
    {
      id: 2,
      name: "Pacote Harmonização Facial",
      description: "Inclui aplicação de botox e preenchimento labial",
      price: 2200,
      discountPercentage: 10,
      services: [
        { id: 3, name: "Aplicação de Botox", price: 1500 },
        { id: 4, name: "Preenchimento Labial", price: 950 }
      ],
      duration: 90,
      validityPeriod: 60,
      isActive: true
    },
    {
      id: 3,
      name: "Pacote Saúde Bucal Completa",
      description: "Inclui limpeza, radiografia e aplicação de flúor",
      price: 350,
      discountPercentage: 20,
      services: [
        { id: 2, name: "Limpeza Dental Profissional", price: 200 },
        { id: 5, name: "Radiografia Panorâmica", price: 150 },
        { id: 6, name: "Aplicação de Flúor", price: 100 }
      ],
      duration: 60,
      validityPeriod: 90,
      isActive: true
    },
    {
      id: 4,
      name: "Pacote Premium - Desativado",
      description: "Pacote de serviços premium desativado",
      price: 3000,
      discountPercentage: 25,
      services: [
        { id: 3, name: "Aplicação de Botox", price: 1500 },
        { id: 2, name: "Limpeza Dental Profissional", price: 200 },
        { id: 5, name: "Radiografia Panorâmica", price: 150 }
      ],
      duration: 180,
      validityPeriod: 120,
      isActive: false
    }
  ];

  // Mock data para os serviços disponíveis
  const services = [
    { id: 1, name: "Clareamento a Laser", price: 800 },
    { id: 2, name: "Limpeza Dental Profissional", price: 200 },
    { id: 3, name: "Aplicação de Botox", price: 1500 },
    { id: 4, name: "Preenchimento Labial", price: 950 },
    { id: 5, name: "Radiografia Panorâmica", price: 150 },
    { id: 6, name: "Aplicação de Flúor", price: 100 },
    { id: 7, name: "Restauração", price: 300 },
    { id: 8, name: "Extração Simples", price: 350 }
  ];

  const handleEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setIsCreateDialogOpen(true);
  };

  const calculateSavings = (pkg: ServicePackage) => {
    const fullPrice = pkg.services.reduce((sum, service) => sum + service.price, 0);
    return fullPrice - pkg.price;
  };

  const getDiscountedValue = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (discountPercentage / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacotes</h1>
          <p className="text-muted-foreground">Gerencie pacotes de serviços com descontos.</p>
        </div>

        <Button onClick={() => {
          setEditingPackage(null);
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pacote
        </Button>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ativos">Pacotes Ativos</TabsTrigger>
          <TabsTrigger value="inativos">Pacotes Inativos</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages
              .filter(pkg => pkg.isActive)
              .map(pkg => (
                <Card key={pkg.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {pkg.discountPercentage}% OFF
                      </Badge>
                    </div>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0 flex-grow">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Preço Total:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">
                            R$ {pkg.services.reduce((sum, service) => sum + service.price, 0).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-lg font-bold">
                            R$ {pkg.price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Economia:</span>
                        <span className="text-green-600 font-medium">
                          R$ {calculateSavings(pkg).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Duração:</span>
                        <span>{pkg.duration} minutos</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Validade:</span>
                        <span>{pkg.validityPeriod} dias</span>
                      </div>
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium mb-2">Serviços Incluídos:</h4>
                        <ul className="space-y-1">
                          {pkg.services.map(service => (
                            <li key={service.id} className="text-sm flex justify-between">
                              <span>{service.name}</span>
                              <span className="text-muted-foreground">R$ {service.price.toLocaleString('pt-BR')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-6">
                    <Button variant="outline" size="sm" onClick={() => handleEditPackage(pkg)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="inativos">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages
                  .filter(pkg => !pkg.isActive)
                  .map(pkg => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.description}</TableCell>
                      <TableCell>R$ {pkg.price.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{pkg.discountPercentage}%</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Editar Pacote" : "Criar Novo Pacote"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage 
                ? "Edite as informações do pacote e clique em salvar quando terminar." 
                : "Adicione um novo pacote de serviços com desconto."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pacote</Label>
                <Input 
                  id="name" 
                  defaultValue={editingPackage?.name || ""} 
                  placeholder="Ex: Pacote Clareamento Premium" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  defaultValue={editingPackage?.discountPercentage || 10} 
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                defaultValue={editingPackage?.description || ""} 
                placeholder="Descreva o que está incluído no pacote..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  defaultValue={editingPackage?.duration || 60} 
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validade (dias)</Label>
                <Input 
                  id="validity" 
                  type="number" 
                  defaultValue={editingPackage?.validityPeriod || 30} 
                  min={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Serviços Incluídos</Label>
              <div className="border rounded-md p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - R$ {service.price.toLocaleString('pt-BR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(editingPackage?.services || []).map(service => (
                    <div key={service.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <span>{service.name}</span>
                      <div className="flex items-center gap-2">
                        <span>R$ {service.price.toLocaleString('pt-BR')}</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t text-sm font-medium">
                  <span>Preço Total:</span>
                  <span>
                    R$ {(editingPackage?.services.reduce((sum, service) => sum + service.price, 0) || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Desconto ({editingPackage?.discountPercentage || 10}%):</span>
                  <span className="text-red-600">
                    - R$ {getDiscountedValue(
                      editingPackage?.services.reduce((sum, service) => sum + service.price, 0) || 0,
                      editingPackage?.discountPercentage || 10
                    ).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Preço Final:</span>
                  <span className="text-green-600 font-bold">
                    R$ {(
                      (editingPackage?.services.reduce((sum, service) => sum + service.price, 0) || 0) - 
                      getDiscountedValue(
                        editingPackage?.services.reduce((sum, service) => sum + service.price, 0) || 0,
                        editingPackage?.discountPercentage || 10
                      )
                    ).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingPackage ? "Salvar Alterações" : "Criar Pacote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}