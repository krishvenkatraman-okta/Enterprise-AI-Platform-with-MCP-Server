import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  warehouseId: string;
}

interface WarehouseInventoryProps {
  warehouseId: string;
  warehouseName: string;
}

const addItemSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  minStockLevel: z.number().min(0, "Min stock level must be 0 or greater"),
});

type AddItemForm = z.infer<typeof addItemSchema>;

export default function WarehouseInventory({ warehouseId, warehouseName }: WarehouseInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", warehouseId],
    enabled: !!warehouseId,
  });

  const form = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "Beverages",
      quantity: 0,
      minStockLevel: 50,
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: AddItemForm) => {
      const response = await apiRequest("POST", "/api/inventory", {
        ...data,
        warehouseId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", warehouseId] });
      form.reset();
      toast({
        title: "Item Added",
        description: "The inventory item has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/inventory/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", warehouseId] });
      toast({
        title: "Item Deleted",
        description: "The inventory item has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddItemForm) => {
    addItemMutation.mutate(data);
  };

  const handleDelete = (itemId: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const filteredInventory = inventory?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Beverages: "🥤",
      Snacks: "🍿",
      Packaging: "📦",
      "Raw Materials": "🏭",
    };
    return icons[category] || "📦";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 rounded" />
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add New Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="SKU-12345" {...field} data-testid="input-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Level</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-min-stock"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Beverages">Beverages</SelectItem>
                            <SelectItem value="Snacks">Snacks</SelectItem>
                            <SelectItem value="Packaging">Packaging</SelectItem>
                            <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addItemMutation.isPending}
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addItemMutation.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Current Inventory - {warehouseName}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-inventory"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {inventory?.length === 0 ? "No Inventory Items" : "No Matching Items"}
                  </h3>
                  <p className="text-gray-600">
                    {inventory?.length === 0 
                      ? "Add your first inventory item using the form on the left."
                      : "Try adjusting your search terms."
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`item-${item.sku}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-xl">{getCategoryIcon(item.category)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900" data-testid={`text-item-name-${item.sku}`}>
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                SKU: {item.sku} • {item.category}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium text-gray-900" data-testid={`text-item-quantity-${item.sku}`}>
                              {item.quantity} units
                            </div>
                            <div className={`text-sm flex items-center ${
                              item.quantity <= item.minStockLevel ? "text-red-600" : "text-green-600"
                            }`}>
                              {item.quantity <= item.minStockLevel && (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {item.quantity <= item.minStockLevel ? "Low Stock" : "In Stock"}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              data-testid={`button-edit-${item.sku}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="text-red-600 hover:text-red-700"
                              disabled={deleteItemMutation.isPending}
                              data-testid={`button-delete-${item.sku}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
