import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageCircle, 
  Mail, 
  MessageSquare, 
  Crown,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026, 2027];

export default function Analytics() {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrdersByMonth();
  }, [allOrders, selectedMonth, selectedYear]);

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

  const filterOrdersByMonth = () => {
    const filtered = allOrders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
    });
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate stats for selected month
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.amount, 0),
    totalItems: filteredOrders.reduce((sum, o) => sum + o.product_items.reduce((s, i) => s + i.quantity, 0), 0),
    completed: filteredOrders.filter(o => o.stages.delivered).length,
    pending: filteredOrders.filter(o => !o.stages.sent_to_delhi).length,
    highPriority: filteredOrders.filter(o => o.is_high_priority).length,
  };

  // Calculate previous month for comparison
  const getPreviousMonthStats = () => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    
    const prevMonthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
    });

    return {
      totalOrders: prevMonthOrders.length,
      totalRevenue: prevMonthOrders.reduce((sum, o) => sum + o.amount, 0),
    };
  };

  const prevStats = getPreviousMonthStats();
  const orderGrowth = prevStats.totalOrders > 0 
    ? ((stats.totalOrders - prevStats.totalOrders) / prevStats.totalOrders * 100).toFixed(1)
    : 0;
  const revenueGrowth = prevStats.totalRevenue > 0
    ? ((stats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto" data-testid="analytics-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-medium tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground text-sm">View orders by month and track performance</p>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">Period:</span>
        </div>
        <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Total Orders</p>
                <p className="text-3xl font-serif font-medium mb-2">{stats.totalOrders}</p>
                <div className="flex items-center gap-1">
                  {parseFloat(orderGrowth) >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">+{orderGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-600">{orderGrowth}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                </div>
              </div>
              <Package className="w-10 h-10 text-brand-red opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Revenue</p>
                <p className="text-3xl font-serif font-medium mb-2">${stats.totalRevenue.toFixed(0)}</p>
                <div className="flex items-center gap-1">
                  {parseFloat(revenueGrowth) >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">+{revenueGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-600">{revenueGrowth}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                </div>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Items Sold</p>
                <p className="text-3xl font-serif font-medium mb-2">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? (stats.totalItems / stats.totalOrders).toFixed(1) : 0} items per order
                </p>
              </div>
              <Package className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Completed</p>
                <p className="text-3xl font-serif font-medium mb-2">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? ((stats.completed / stats.totalOrders) * 100).toFixed(0) : 0}% fulfillment rate
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
                <p className="text-2xl font-serif font-medium">
                  ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-2xl font-serif font-medium">{stats.pending}</p>
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

      {/* Orders Table */}
      <Card className="border-border">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-serif">
            Orders - {MONTHS[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No orders in {MONTHS[selectedMonth]} {selectedYear}</p>
              <p className="text-sm text-muted-foreground">Try selecting a different month</p>
            </div>
          ) : (
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
                    <th className="p-3 font-medium">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredOrders.map((order) => {
                    const status = getOrderStatus(order.stages);
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
