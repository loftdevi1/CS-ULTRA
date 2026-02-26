import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, MessageSquare, Crown, Clock, Package } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders(filter);
    fetchReminders();
  }, [filter]);

  const fetchOrders = async (filterType = null) => {
    try {
      const url = filterType ? `${API}/orders?filter=${filterType}` : `${API}/orders`;
      const response = await axios.get(url);
      setOrders(response.data);
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

  const getOrderStatus = (stages) => {
    if (stages.delivered) return "Delivered";
    if (stages.reached_country) return "Reached Country";
    if (stages.left_xportel) return "In Transit";
    if (stages.sent_to_delhi) return "Sent to Delhi";
    if (stages.ready_to_dispatch) return "Ready to Dispatch";
    if (stages.washing) return "Washing";
    if (stages.customizing) return "Customizing";
    if (stages.in_embroidery) return "In Embroidery";
    return "Not Started";
  };

  const getStatusColor = (status) => {
    const colors = {
      "Delivered": "bg-green-100 text-green-800",
      "Reached Country": "bg-blue-100 text-blue-800",
      "In Transit": "bg-purple-100 text-purple-800",
      "Sent to Delhi": "bg-indigo-100 text-indigo-800",
      "Ready to Dispatch": "bg-yellow-100 text-yellow-800",
      "Washing": "bg-cyan-100 text-cyan-800",
      "Customizing": "bg-orange-100 text-orange-800",
      "In Embroidery": "bg-pink-100 text-pink-800",
      "Not Started": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const highPriorityOrders = orders.filter((order) => order.is_high_priority);
  const pendingOrders = orders.filter((order) => !order.stages.delivered);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto" data-testid="dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-2" data-testid="dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground tracking-wide">Overview of all orders and customer touchpoints</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="stats-grid">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid="stat-total-orders">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans text-muted-foreground tracking-widest uppercase">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-brand-red" />
              <span className="text-4xl font-serif font-medium">{orders.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid="stat-pending-dispatch">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans text-muted-foreground tracking-widest uppercase">Pending Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-4xl font-serif font-medium">{pendingOrders.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid="stat-high-priority">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans text-muted-foreground tracking-widest uppercase">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-brand-gold" />
              <span className="text-4xl font-serif font-medium">{highPriorityOrders.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card className="mb-8 border-destructive bg-red-50" data-testid="reminders-card">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Clock className="w-5 h-5 text-destructive" />
              Orders Needing Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.order_id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-destructive/20"
                  data-testid={`reminder-${reminder.order_id}`}
                >
                  <div>
                    <p className="font-medium">{reminder.customer_name}</p>
                    <p className="text-sm text-muted-foreground">Last updated {reminder.days_since_update} days ago</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/orders/${reminder.order_id}`)}
                    size="sm"
                    data-testid={`view-reminder-${reminder.order_id}`}
                  >
                    Update
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-6" data-testid="orders-list">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-medium">All Orders</h2>
          <Button onClick={() => navigate("/create-order")} data-testid="create-order-btn">
            Create New Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center" data-testid="no-orders">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button onClick={() => navigate("/create-order")} data-testid="create-first-order-btn">
              Create Your First Order
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const status = getOrderStatus(order.stages);
              const touchpointCount = [order.touchpoints.whatsapp, order.touchpoints.email, order.touchpoints.crisp].filter(Boolean).length;
              
              return (
                <Card
                  key={order.id}
                  className="border-border hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  data-testid={`order-card-${order.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-serif font-medium" data-testid="order-customer-name">{order.customer_name}</h3>
                          {order.is_high_priority && (
                            <Badge className="bg-brand-gold text-white border-brand-gold" data-testid="high-priority-badge">
                              <Crown className="w-3 h-3 mr-1" />
                              High Priority
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Order Date</p>
                            <p className="font-medium" data-testid="order-date">{order.order_date}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Product</p>
                            <p className="font-medium" data-testid="order-product">{order.product_items}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium text-brand-red" data-testid="order-amount">${order.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium" data-testid="order-quantity">{order.quantity}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(status)} data-testid="order-status">{status}</Badge>
                          
                          {/* Touchpoint Icons */}
                          <div className="flex items-center gap-2" data-testid="touchpoint-indicators">
                            <MessageCircle
                              className={`w-5 h-5 ${
                                order.touchpoints.whatsapp ? "text-whatsapp-green" : "text-gray-300"
                              }`}
                              data-testid="touchpoint-whatsapp"
                            />
                            <Mail
                              className={`w-5 h-5 ${
                                order.touchpoints.email ? "text-email-gold" : "text-gray-300"
                              }`}
                              data-testid="touchpoint-email"
                            />
                            <MessageSquare
                              className={`w-5 h-5 ${
                                order.touchpoints.crisp ? "text-crisp-blue" : "text-gray-300"
                              }`}
                              data-testid="touchpoint-crisp"
                            />
                          </div>

                          {touchpointCount > 0 && (
                            <span className="text-sm text-muted-foreground" data-testid="touchpoint-count">
                              {touchpointCount} touchpoint{touchpointCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
