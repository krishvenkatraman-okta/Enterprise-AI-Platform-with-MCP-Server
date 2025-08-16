import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import WarehouseInventory from "./WarehouseInventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, AlertTriangle } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  state: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
}

export default function InventoryApp() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: allInventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", selectedWarehouse],
    enabled: !!selectedWarehouse,
  });

  // Calculate statistics
  const totalSKUs = allInventory?.length || 0;
  const lowStockItems = allInventory?.filter(item => item.quantity <= item.minStockLevel) || [];

  return (
    <AuthGuard
      application="inventory"
      title="Atlas Beverages"
      description="Secure Inventory Management"
      icon="fas fa-boxes"
      theme="atlas"
    >
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-inventory-title">
                Atlas Beverages Inventory
              </h1>
              <p className="text-gray-600 mt-1">Manage warehouse inventory across all locations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Card className="bg-blue-50">
                <CardContent className="p-3">
                  <div className="text-sm text-blue-600">Total SKUs</div>
                  <div className="text-2xl font-bold text-blue-700" data-testid="text-total-skus">
                    {totalSKUs}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50">
                <CardContent className="p-3">
                  <div className="text-sm text-red-600">Low Stock Alerts</div>
                  <div className="text-2xl font-bold text-red-700" data-testid="text-low-stock-count">
                    {lowStockItems.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Warehouse Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex px-6">
            {warehousesLoading ? (
              <div className="py-4 text-gray-500">Loading warehouses...</div>
            ) : (
              warehouses?.map((warehouse) => (
                <button
                  key={warehouse.id}
                  onClick={() => setSelectedWarehouse(warehouse.id)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    selectedWarehouse === warehouse.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid={`button-warehouse-${warehouse.state.toLowerCase()}`}
                >
                  <MapPin className="w-4 h-4 inline-block mr-2" />
                  {warehouse.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {!selectedWarehouse ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Warehouse
                  </h3>
                  <p className="text-gray-600">
                    Choose a warehouse from the tabs above to view and manage inventory.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <WarehouseInventory 
              warehouseId={selectedWarehouse} 
              warehouseName={warehouses?.find(w => w.id === selectedWarehouse)?.name || ""}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
