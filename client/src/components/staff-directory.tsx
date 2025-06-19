import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Loader2, Mail, Phone, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface StaffDirectoryProps {
  staff: any[];
  isLoading: boolean;
  view: 'cards' | 'list';
}

export default function StaffDirectory({ staff, isLoading, view }: StaffDirectoryProps) {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  function handleViewStaff(staff: any) {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (staff.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="font-medium text-lg mb-2">Nenhum membro da equipe encontrado</h3>
        <p className="text-muted-foreground mb-6">
          Não há membros da equipe no sistema ainda ou nenhum corresponde aos seus critérios de busca.
        </p>
      </div>
    );
  }

  // Card view
  if (view === 'cards') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Avatar className="mr-4 h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.user?.fullName || 'Staff Member')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.user?.fullName || `Staff #${member.id}`}</CardTitle>
                      <CardDescription>{member.specialization}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={member.available ? "default" : "secondary"}>
                    {member.available ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {member.bio ? (
                  <p className="text-sm line-clamp-3">{member.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem biografia disponível</p>
                )}

                <div className="mt-4 space-y-2">
                  {member.user?.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{member.user.email}</span>
                    </div>
                  )}
                  {member.user?.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{member.user.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewStaff(member)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View Staff Dialog */}
        {selectedStaff && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{selectedStaff.user?.fullName || `Staff #${selectedStaff.id}`}</DialogTitle>
                <DialogDescription>
                  {selectedStaff.specialization}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials(selectedStaff.user?.fullName || 'Staff Member')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{selectedStaff.user?.fullName || `Staff #${selectedStaff.id}`}</h3>
                    <p className="text-muted-foreground">{selectedStaff.specialization}</p>
                    <Badge className="mt-1" variant={selectedStaff.available ? "default" : "secondary"}>
                      {selectedStaff.available ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Biografia</h4>
                  <p className="whitespace-pre-wrap">{selectedStaff.bio || "Sem biografia disponível"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                    <p>{selectedStaff.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Telefone</h4>
                    <p>{selectedStaff.user?.phone || "N/A"}</p>
                  </div>
                </div>

                {selectedStaff.user?.role && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Função</h4>
                    <p className="capitalize">{selectedStaff.user.role}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  // List view
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membro da Equipe</TableHead>
            <TableHead>Especialização</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(member.user?.fullName || 'Staff')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.user?.fullName || `Staff #${member.id}`}</span>
                </div>
              </TableCell>
              <TableCell>{member.specialization}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                  {member.user?.email && (
                    <span className="text-sm flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                      {member.user.email}
                    </span>
                  )}
                  {member.user?.phone && (
                    <span className="text-sm flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      {member.user.phone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {member.available ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm">Disponível</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm">Indisponível</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewStaff(member)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Staff Dialog (same as in card view) */}
      {selectedStaff && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedStaff.user?.fullName || `Staff #${selectedStaff.id}`}</DialogTitle>
              <DialogDescription>
                {selectedStaff.specialization}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedStaff.user?.fullName || 'Staff Member')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{selectedStaff.user?.fullName || `Staff #${selectedStaff.id}`}</h3>
                  <p className="text-muted-foreground">{selectedStaff.specialization}</p>
                  <Badge className="mt-1" variant={selectedStaff.available ? "default" : "secondary"}>
                    {selectedStaff.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Bio</h4>
                <p className="whitespace-pre-wrap">{selectedStaff.bio || "No bio available"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p>{selectedStaff.user?.email || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                  <p>{selectedStaff.user?.phone || "N/A"}</p>
                </div>
              </div>

              {selectedStaff.user?.role && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Role</h4>
                  <p className="capitalize">{selectedStaff.user.role}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
