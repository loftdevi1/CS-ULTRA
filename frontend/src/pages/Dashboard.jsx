import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Mail, 
  MessageSquare, 
  Crown, 
  Clock, 
  Package,
  Bell,
  X,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchReminders();
  }, []);

  useEffect(() => {
    applyFilter(activeTab);
  }, [allOrders, activeTab]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setAllOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await axios.get(`${API}/reminders`);
      setReminders(response.data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  };

  const applyFilter = (tab) => {
    let filtered = [...allOrders];
    
    // First, filter out all delivered orders from active tabs
    if (tab !== "completed") {
      filtered = filtered.filter(o => !o.stages.delivered);
    }
    
    switch (tab) {
      case "unfulfilled":
        // Only show orders that haven't been dispatched yet
        filtered = filtered.filter(o => !o.stages.sent_to_delhi && !o.stages.left_xportel && !o.stages.reached_country && !o.stages.delivered);
        break;
      case "high_priority":
        filtered = filtered.filter(o => o.is_high_priority && !o.stages.delivered);
        break;
      case "completed":
        filtered = filtered.filter(o => o.stages.delivered);
        break;
      case "all":
      default:
        // Already filtered out delivered orders above
        break;
    }
    
    setFilteredOrders(filtered);
  };

  const getOrderStatus = (stages) => {
    if (stages.delivered) return { label: "Delivered", color: "bg-green-100 text-green-800" };
    if (stages.reached_country) return { label: "In Transit", color: "bg-blue-100 text-blue-800" };
    if (stages.sent_to_delhi) return { label: "Dispatched", color: "bg-purple-100 text-purple-800" };
    if (stages.ready_to_dispatch) return { label: "Ready", color: "bg-cyan-100 text-cyan-800" };
    if (stages.washing) return { label: "Washing", color: "bg-orange-100 text-orange-800" };
    if (stages.customizing) return { label: "Customizing", color: "bg-yellow-100 text-yellow-800" };
    if (stages.in_embroidery) return { label: "In Progress", color: "bg-pink-100 text-pink-800" };
    return { label: "Unfulfilled", color: "bg-yellow-100 text-yellow-800" };
  };

  const getFulfillmentStatus = (stages) => {
    // Once dispatched or beyond, it's fulfilled
    if (stages.sent_to_delhi || stages.left_xportel || stages.reached_country || stages.delivered) {
      return { label: "Fulfilled", color: "bg-gray-100 text-gray-800" };
    }
    return { label: "Unfulfilled", color: "bg-yellow-100 text-yellow-800" };
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Calculate stats
  const stats = {
    total: allOrders.length,
    unfulfilled: allOrders.filter(o => !o.stages.delivered).length,
    highPriority: allOrders.filter(o => o.is_high_priority).length,
    completed: allOrders.filter(o => o.stages.delivered).length,
    totalItems: allOrders.reduce((sum, o) => sum + o.product_items.reduce((s, i) => s + i.quantity, 0), 0)
  };

  const completedOrders = allOrders.filter(o => o.stages.delivered);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4 pr-12 lg:pr-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{stats.total} total orders</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              {reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {reminders.length}
                </span>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <Card className="absolute right-0 top-12 w-96 shadow-xl z-50 border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-serif">Notifications</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-auto">
                  {reminders.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending reminders</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {reminders.map((reminder) => (
                        <div 
                          key={reminder.order_id}
                          className="p-4 hover:bg-secondary/20 cursor-pointer transition-colors"
                          onClick={() => {
                            navigate(`/orders/${reminder.order_id}`);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{reminder.customer_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last updated {reminder.days_since_update} days ago
                              </p>
                              <p className="text-xs text-brand-red font-medium mt-1">
                                ${reminder.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <Button onClick={() => navigate("/create-order")} data-testid="create-order-btn">
            Create order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                <p className="text-2xl font-serif font-medium">{stats.unfulfilled}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+50%</span>
                </div>
              </div>
              <Package className="w-8 h-8 text-brand-red opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Items ordered</p>
                <p className="text-2xl font-serif font-medium">{stats.totalItems}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+50%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Orders fulfilled</p>
                <p className="text-2xl font-serif font-medium">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">High Priority</p>
                <p className="text-2xl font-serif font-medium">{stats.highPriority}</p>
              </div>
              <Crown className="w-8 h-8 text-brand-gold opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders Section */}
      <Card className="border-border mb-6">
        <CardHeader className="border-b border-border/50 pb-0 px-0 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="bg-transparent border-0 p-0 h-auto w-full flex justify-start px-2 md:px-0">
                <TabsTrigger 
                  value="all" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-red data-[state=active]:bg-transparent text-xs md:text-sm px-3 md:px-4 whitespace-nowrap"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="unfulfilled"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-red data-[state=active]:bg-transparent text-xs md:text-sm px-3 md:px-4 whitespace-nowrap"
                >
                  Unfulfilled
                </TabsTrigger>
                <TabsTrigger 
                  value="high_priority"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-red data-[state=active]:bg-transparent text-xs md:text-sm px-3 md:px-4 whitespace-nowrap"
                >
                  Priority
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-red data-[state=active]:bg-transparent text-xs md:text-sm px-3 md:px-4 whitespace-nowrap"
                >
                  Done
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No orders in this category</p>
              <Button onClick={() => navigate("/create-order")}>Create Your First Order</Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium w-12">
                      <Checkbox 
                        checked={selectedOrders.length === filteredOrders.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Fulfillment</th>
                    <th className="p-3 font-medium">Items</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredOrders.map((order) => {
                    const status = getOrderStatus(order.stages);
                    const fulfillment = getFulfillmentStatus(order.stages);
                    const totalItems = order.product_items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <tr 
                        key={order.id}
                        className="hover:bg-secondary/10 cursor-pointer transition-colors"
                        onClick={(e) => {
                          if (!e.target.closest('input[type="checkbox"]')) {
                            navigate(`/orders/${order.id}`);
                          }
                        }}
                      >
                        <td className="p-3">
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{order.order_number}</span>
                            {order.is_high_priority && (
                              <Crown className="w-4 h-4 text-brand-gold" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {order.customer_name}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          ${order.amount.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge className={`${fulfillment.color} text-xs`}>
                            {fulfillment.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </td>
                        <td className="p-3">
                          <Badge className={`${status.color} text-xs`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <MessageCircle
                              className={`w-4 h-4 ${
                                order.touchpoints.whatsapp ? "text-whatsapp-green" : "text-gray-300"
                              }`}
                            />
                            <Mail
                              className={`w-4 h-4 ${
                                order.touchpoints.email ? "text-email-gold" : "text-gray-300"
                              }`}
                            />
                            <MessageSquare
                              className={`w-4 h-4 ${
                                order.touchpoints.crisp ? "text-crisp-blue" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/30">
              {filteredOrders.map((order) => {
                const status = getOrderStatus(order.stages);
                const totalItems = order.product_items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <div
                    key={order.id}
                    className="p-3 hover:bg-secondary/10 cursor-pointer transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm truncate">#{order.order_number}</span>
                            {order.is_high_priority && (
                              <Crown className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                            )}
                          </div>
                          <Badge className={`${status.color} text-xs flex-shrink-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatDate(order.order_date)}
                        </p>
                        
                        <p className="text-sm font-medium mb-1 truncate">{order.customer_name}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                          <span className="font-medium text-brand-red">${order.amount.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MessageCircle
                            className={`w-3.5 h-3.5 ${
                              order.touchpoints.whatsapp ? "text-whatsapp-green" : "text-gray-300"
                            }`}
                          />
                          <Mail
                            className={`w-3.5 h-3.5 ${
                              order.touchpoints.email ? "text-email-gold" : "text-gray-300"
                            }`}
                          />
                          <MessageSquare
                            className={`w-3.5 h-3.5 ${
                              order.touchpoints.crisp ? "text-crisp-blue" : "text-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Completed Orders Section */}
      {completedOrders.length > 0 && activeTab !== "completed" && (
        <Card className="border-border">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg font-serif">Completed Orders ({completedOrders.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Items</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {completedOrders.slice(0, 5).map((order) => {
                    const totalItems = order.product_items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <tr 
                        key={order.id}
                        className="hover:bg-secondary/10 cursor-pointer transition-colors"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{order.order_number}</span>
                            {order.is_high_priority && (
                              <Crown className="w-4 h-4 text-brand-gold" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {order.customer_name}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          ${order.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </td>
                        <td className="p-3">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Delivered
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {completedOrders.length > 5 && (
              <div className="p-4 text-center border-t border-border/30">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab("completed")}
                >
                  View all {completedOrders.length} completed orders
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
