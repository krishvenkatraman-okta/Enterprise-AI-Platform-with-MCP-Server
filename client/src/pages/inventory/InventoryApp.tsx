import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService, type AuthState } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/AuthGuard";
import WarehouseInventory from "./WarehouseInventory";
import TokenSidebar from "@/components/TokenSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, AlertTriangle, Key, User, Home } from "lucide-react";

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
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [isTokenSidebarOpen, setIsTokenSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await authService.logout();
  };

  const getUserInitials = () => {
    if (!authState.user) return "U";
    return `${authState.user.firstName[0]}${authState.user.lastName[0]}`;
  };

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
    enabled: authState.isAuthenticated && authState.session?.application === 'inventory',
  });

  const { data: allInventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", selectedWarehouse],
    enabled: !!selectedWarehouse && authState.isAuthenticated && authState.session?.application === 'inventory',
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
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900" data-testid="text-app-title">
                    Atlas Beverages
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTokenSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-tokens"
                >
                  <Key className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Tokens</span>
                </Button>
                {authState.user && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium" data-testid="text-user-initials">
                        {getUserInitials()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700" data-testid="text-user-name">
                      {authState.user.firstName} {authState.user.lastName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        
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
        
        {/* Token Sidebar */}
        <TokenSidebar 
          isOpen={isTokenSidebarOpen} 
          onClose={() => setIsTokenSidebarOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
}
