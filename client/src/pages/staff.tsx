import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffDirectory from "@/components/staff-directory";
import { useToast } from "@/hooks/use-toast";

export default function Staff() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch staff members
  const { data: staff, isLoading } = useQuery({
    queryKey: ['/api/staff'],
  });

  // Filter staff members based on search query
  const filteredStaff = staff?.filter((member: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      member.user?.fullName.toLowerCase().includes(query) ||
      member.specialization.toLowerCase().includes(query)
    );
  });

  // Export staff directory as CSV
  function exportStaffDirectory() {
    if (!staff || staff.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no staff members to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Name", "Specialization", "Bio", "Available", "Email", "Phone"];
    const csvContent = [
      headers.join(","),
      ...staff.map((member: any) => [
        `"${member.user?.fullName || ''}"`,
        `"${member.specialization}"`,
        `"${member.bio || ""}"`,
        member.available ? "Yes" : "No",
        `"${member.user?.email || ""}"`,
        `"${member.user?.phone || ""}"`
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "staff_directory.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Diretório de Equipe</h1>
          <p className="text-muted-foreground">Gerencie a equipe e os profissionais da sua clínica.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro da Equipe
          </Button>
          <Button variant="outline" onClick={exportStaffDirectory}>
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
            placeholder="Buscar no diretório de equipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Visualização em Cards</TabsTrigger>
          <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards">
          <StaffDirectory 
            staff={filteredStaff || []} 
            isLoading={isLoading} 
            view="cards" 
          />
        </TabsContent>
        
        <TabsContent value="list">
          <StaffDirectory 
            staff={filteredStaff || []} 
            isLoading={isLoading} 
            view="list" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
