import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, User, Send, Mic, ShieldCheck, AlertTriangle } from "lucide-react";

interface InventoryData {
  warehouse: {
    id: string;
    name: string;
    location: string;
    state: string;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    minStockLevel: number;
  }>;
  totalItems: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    minStockLevel: number;
  }>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'jarvis' | 'system';
  content: string;
  timestamp: Date;
  inventoryData?: InventoryData[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryData } = useQuery<InventoryData[]>({
    queryKey: ["/api/jarvis/inventory"],
    enabled: hasAccessToken,
  });

  const tokenExchangeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/token-exchange', {
        targetApp: 'inventory'
      });
      return response.json();
    },
    onSuccess: () => {
      setHasAccessToken(true);
      queryClient.invalidateQueries({ queryKey: ["/api/jarvis/inventory"] });
      addMessage({
        type: 'system',
        content: 'Cross-app authentication successful. I now have access to Atlas Beverages inventory system.',
      });
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Unable to establish cross-app access to inventory system.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Initialize with welcome message
    addMessage({
      type: 'jarvis',
      content: `Good ${getTimeOfDay()}, ${authService.getState().user?.firstName}. I'm J.A.R.V.I.S, your AI assistant with secure access to Atlas Beverages inventory system. How can I assist you today?`,
    });

    // Attempt cross-app authentication
    tokenExchangeMutation.mutate();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    addMessage({
      type: 'user',
      content: inputValue,
    });

    // Process the message
    processUserMessage(inputValue);
    setInputValue("");
  };

  const processUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Simulate processing delay
    setTimeout(() => {
      if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
        if (!hasAccessToken) {
          addMessage({
            type: 'jarvis',
            content: 'I need to establish cross-app access first. Let me authenticate with the inventory system...',
          });
          tokenExchangeMutation.mutate();
          return;
        }

        if (inventoryData) {
          addMessage({
            type: 'jarvis',
            content: `I've accessed the Atlas Beverages inventory system through cross-app authentication. Here's the current status across all warehouses:`,
            inventoryData,
          });
        } else {
          addMessage({
            type: 'jarvis',
            content: 'Let me fetch the latest inventory data for you...',
          });
          queryClient.invalidateQueries({ queryKey: ["/api/jarvis/inventory"] });
        }
      } else if (lowerMessage.includes('texas') || lowerMessage.includes('california') || lowerMessage.includes('nevada')) {
        const state = lowerMessage.includes('texas') ? 'Texas' : 
                     lowerMessage.includes('california') ? 'California' : 'Nevada';
        const warehouseData = inventoryData?.find(w => w.warehouse.state === state);
        
        if (warehouseData) {
          addMessage({
            type: 'jarvis',
            content: `Here's the current inventory status for ${warehouseData.warehouse.name}:`,
            inventoryData: [warehouseData],
          });
        } else {
          addMessage({
            type: 'jarvis',
            content: `I don't have access to ${state} warehouse data at the moment. Let me refresh the inventory information.`,
          });
        }
      } else if (lowerMessage.includes('low stock') || lowerMessage.includes('reorder')) {
        const allLowStock = inventoryData?.flatMap(w => 
          w.lowStockItems.map(item => ({ ...item, warehouse: w.warehouse.name }))
        ) || [];

        if (allLowStock.length > 0) {
          addMessage({
            type: 'jarvis',
            content: `I've identified ${allLowStock.length} items with low stock levels that require immediate attention. These items are below their minimum stock thresholds and should be reordered soon.`,
          });
        } else {
          addMessage({
            type: 'jarvis',
            content: 'Great news! All inventory items are currently above their minimum stock levels. No immediate reorders are required.',
          });
        }
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        addMessage({
          type: 'jarvis',
          content: 'I can help you with:\n\n• View inventory levels across all warehouses\n• Check specific warehouse inventory (Texas, California, Nevada)\n• Identify low stock items and reorder recommendations\n• Generate inventory reports and analytics\n• Monitor stock movements and trends\n\nWhat would you like to know about the Atlas Beverages inventory?',
        });
      } else {
        addMessage({
          type: 'jarvis',
          content: "I'm here to help with Atlas Beverages inventory management. You can ask me about stock levels, warehouse status, low stock alerts, or reorder recommendations. What would you like to know?",
        });
      }
    }, 1000);
  };

  const suggestedQuestions = [
    "Check California warehouse",
    "Generate reorder report", 
    "Low stock analysis",
    "Show all warehouse status"
  ];

  const formatInventoryData = (data: InventoryData[]) => {
    return data.map(warehouse => (
      <Card key={warehouse.warehouse.id} className="bg-slate-800 border-amber-400/30 mt-3">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-amber-400">{warehouse.warehouse.name}</h4>
            <Badge variant="secondary" className="bg-slate-700 text-amber-400">
              {warehouse.totalItems} SKUs
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {warehouse.items.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="text-amber-400">{item.name}</div>
                <div className={`font-medium ${
                  item.quantity <= item.minStockLevel ? "text-red-400" : "text-white"
                }`}>
                  {item.quantity} units {item.quantity <= item.minStockLevel && "⚠️"}
                </div>
              </div>
            ))}
          </div>
          {warehouse.lowStockItems.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700">
              <div className="text-red-400 text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {warehouse.lowStockItems.length} item(s) need reordering
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur-sm shadow-xl border-b border-amber-400/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative mr-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center animate-pulse">
                <Bot className="w-6 h-6 text-slate-900" />
              </div>
              <div className="absolute inset-0 w-12 h-12 border border-amber-400 rounded-full animate-spin opacity-50" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>
                J.A.R.V.I.S
              </h1>
              <p className="text-amber-400">AI Assistant with Enterprise Access</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Card className="bg-slate-900 border-amber-400/30">
              <CardContent className="p-3">
                <div className="text-sm text-amber-400">System Status</div>
                <div className="text-xl font-bold text-white">ONLINE</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-amber-400/30">
              <CardContent className="p-3">
                <div className="text-sm text-amber-400">Connected Apps</div>
                <div className="text-xl font-bold text-white">{hasAccessToken ? "1" : "0"}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-end' : ''
            }`}>
              {message.type !== 'user' && (
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-slate-900" />
                </div>
              )}
              
              <div className={`rounded-2xl px-4 py-3 max-w-2xl ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'system'
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-800 border border-amber-400/30 text-white'
              }`}>
                <p className="whitespace-pre-line" data-testid={`message-${message.type}-${message.id}`}>
                  {message.content}
                </p>
                
                {message.inventoryData && (
                  <div className="mt-3">
                    {formatInventoryData(message.inventoryData)}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Suggested Actions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 justify-center" data-testid="suggested-actions">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(question);
                    handleSendMessage();
                  }}
                  className="bg-slate-800 border-amber-400/30 text-amber-400 hover:bg-amber-400 hover:text-slate-900 transition-colors"
                  data-testid={`button-suggestion-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-t border-amber-400/30 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Jarvis about inventory, reports, or analytics..."
                className="w-full bg-slate-900 border-amber-400/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-400"
                data-testid="input-chat-message"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-300"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
          <div className="flex items-center justify-center mt-3 text-xs text-gray-400">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Secured with cross-app authentication
          </div>
        </div>
      </div>
    </div>
  );
}
