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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Minus, Package, AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InventoryTableProps {
  inventory: any[];
  isLoading: boolean;
}

// Form schema for inventory item update
const inventoryUpdateFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Quantity must be a non-negative number." }),
  unit: z.string().min(1, { message: "Unit is required." }),
  threshold: z.coerce.number().min(0, { message: "Threshold must be a non-negative number." }),
  price: z.coerce.number().min(0, { message: "Price must be a non-negative number." }),
});

// Form schema for quantity adjustment
const quantityAdjustFormSchema = z.object({
  quantity: z.coerce.number().int().min(1, { message: "Quantity must be a positive number." }),
  reason: z.string().min(2, { message: "Reason is required." }),
});

type InventoryUpdateFormValues = z.infer<typeof inventoryUpdateFormSchema>;
type QuantityAdjustFormValues = z.infer<typeof quantityAdjustFormSchema>;

export default function InventoryTable({ inventory, isLoading }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [isRemoveStockDialogOpen, setIsRemoveStockDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize edit form
  const editForm = useForm<InventoryUpdateFormValues>({
    resolver: zodResolver(inventoryUpdateFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      quantity: 0,
      unit: "",
      threshold: 0,
      price: 0,
    },
  });

  // Initialize add stock form
  const addStockForm = useForm<QuantityAdjustFormValues>({
    resolver: zodResolver(quantityAdjustFormSchema),
    defaultValues: {
      quantity: 1,
      reason: "Restock",
    },
  });

  // Initialize remove stock form
  const removeStockForm = useForm<QuantityAdjustFormValues>({
    resolver: zodResolver(quantityAdjustFormSchema),
    defaultValues: {
      quantity: 1,
      reason: "Used in procedure",
    },
  });

  // Update inventory mutation
  const updateInventory = useMutation({
    mutationFn: async (values: InventoryUpdateFormValues) => {
      if (!selectedItem) return;
      const response = await apiRequest('PUT', `/api/inventory/${selectedItem.id}`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete inventory mutation
  const deleteInventory = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      const response = await apiRequest('DELETE', `/api/inventory/${selectedItem.id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add stock mutation
  const addStock = useMutation({
    mutationFn: async (values: QuantityAdjustFormValues) => {
      if (!selectedItem) return;
      const newQuantity = selectedItem.quantity + values.quantity;
      const response = await apiRequest('PUT', `/api/inventory/${selectedItem.id}`, {
        quantity: newQuantity,
        lastRestocked: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsAddStockDialogOpen(false);
      addStockForm.reset({ quantity: 1, reason: "Restock" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove stock mutation
  const removeStock = useMutation({
    mutationFn: async (values: QuantityAdjustFormValues) => {
      if (!selectedItem) return;
      const newQuantity = Math.max(0, selectedItem.quantity - values.quantity);
      const response = await apiRequest('PUT', `/api/inventory/${selectedItem.id}`, {
        quantity: newQuantity,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsRemoveStockDialogOpen(false);
      removeStockForm.reset({ quantity: 1, reason: "Used in procedure" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle edit item
  function handleEditItem(item: any) {
    setSelectedItem(item);
    editForm.reset({
      name: item.name,
      category: item.category,
      description: item.description || "",
      quantity: item.quantity,
      unit: item.unit,
      threshold: item.threshold,
      price: item.price,
    });
    setIsEditDialogOpen(true);
  }

  // Handle delete item
  function handleDeleteItem(item: any) {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  }

  // Handle add stock
  function handleAddStock(item: any) {
    setSelectedItem(item);
    addStockForm.reset({
      quantity: 1,
      reason: "Restock",
    });
    setIsAddStockDialogOpen(true);
  }

  // Handle remove stock
  function handleRemoveStock(item: any) {
    setSelectedItem(item);
    removeStockForm.reset({
      quantity: 1,
      reason: "Used in procedure",
    });
    setIsRemoveStockDialogOpen(true);
  }

  // Handle form submissions
  function onEditSubmit(values: InventoryUpdateFormValues) {
    updateInventory.mutate(values);
  }

  function onAddStockSubmit(values: QuantityAdjustFormValues) {
    addStock.mutate(values);
  }

  function onRemoveStockSubmit(values: QuantityAdjustFormValues) {
    removeStock.mutate(values);
  }

  // Get stock status
  function getStockStatus(item: any) {
    if (item.quantity <= 0) {
      return { label: "Sem Estoque", variant: "destructive", icon: <AlertTriangle className="h-3 w-3 mr-1" /> };
    } else if (item.quantity <= item.threshold) {
      return { label: "Estoque Baixo", variant: "warning", icon: <AlertTriangle className="h-3 w-3 mr-1" /> };
    } else {
      return { label: "Em Estoque", variant: "success", icon: null };
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">Nenhum item encontrado no estoque</h3>
        <p className="text-muted-foreground mb-6">
          Não há itens de estoque no sistema ainda ou nenhum item corresponde aos seus critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead className="hidden md:table-cell">Última Reposição</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const stockStatus = getStockStatus(item);
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <span>{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {item.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                    <Badge variant={stockStatus.variant as any} className="mt-1 w-fit flex items-center">
                      {stockStatus.icon}
                      {stockStatus.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.lastRestocked ? formatDate(item.lastRestocked) : "Never"}
                </TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddStock(item)}>
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="sr-only md:not-sr-only md:inline-flex">Adicionar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemoveStock(item)}
                      disabled={item.quantity <= 0}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      <span className="sr-only md:not-sr-only md:inline-flex">Remover</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Edit Item Dialog */}
      {selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update the inventory item details below.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Threshold</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateInventory.isPending}>
                    {updateInventory.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedItem && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-medium">{selectedItem.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteInventory.mutate()}
                disabled={deleteInventory.isPending}
              >
                {deleteInventory.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Add Stock Dialog */}
      {selectedItem && (
        <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
              <DialogDescription>
                Add stock to {selectedItem.name}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addStockForm}>
              <form onSubmit={addStockForm.handleSubmit(onAddStockSubmit)} className="space-y-4">
                <FormField
                  control={addStockForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Add</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min="1" />
                      </FormControl>
                      <FormDescription>
                        Current stock: {selectedItem.quantity} {selectedItem.unit}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addStockForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddStockDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addStock.isPending}>
                    {addStock.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Stock
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Stock Dialog */}
      {selectedItem && (
        <Dialog open={isRemoveStockDialogOpen} onOpenChange={setIsRemoveStockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Remove Stock</DialogTitle>
              <DialogDescription>
                Remove stock from {selectedItem.name}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...removeStockForm}>
              <form onSubmit={removeStockForm.handleSubmit(onRemoveStockSubmit)} className="space-y-4">
                <FormField
                  control={removeStockForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Remove</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min="1" 
                          max={selectedItem.quantity} 
                        />
                      </FormControl>
                      <FormDescription>
                        Current stock: {selectedItem.quantity} {selectedItem.unit}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={removeStockForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRemoveStockDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={removeStock.isPending || selectedItem.quantity <= 0}
                  >
                    {removeStock.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Remove Stock
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
