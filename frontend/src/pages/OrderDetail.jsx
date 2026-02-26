import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Mail, MessageSquare, Crown, ArrowLeft, Check, Bell, Archive } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STAGES = [
  { key: "in_embroidery", label: "In Embroidery" },
  { key: "customizing", label: "Customizing" },
  { key: "washing", label: "Washing" },
  { key: "ready_to_dispatch", label: "Ready to Dispatch" },
  { key: "sent_to_delhi", label: "Dispatched to Customer" },
  { key: "left_xportel", label: "Left Xportel Facility" },
  { key: "reached_country", label: "Reached to the Country" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [touchpointNotes, setTouchpointNotes] = useState("");
  const [reminderDays, setReminderDays] = useState(0);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setTouchpointNotes(response.data.touchpoints.notes || "");
      if (response.data.custom_reminder) {
        setReminderDays(response.data.custom_reminder.days || 0);
        setReminderTime(response.data.custom_reminder.time || "");
        setReminderNote(response.data.custom_reminder.note || "");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const updateTouchpoint = async (touchpointKey) => {
    if (!order) return;

    const newTouchpoints = {
      ...order.touchpoints,
      [touchpointKey]: !order.touchpoints[touchpointKey],
      notes: touchpointNotes,
    };

    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      const response = await axios.put(`${API}/orders/${orderId}`, {
        touchpoints: newTouchpoints,
      });
      setOrder(response.data);
      toast.success("Touchpoint updated");
    } catch (error) {
      console.error("Failed to update touchpoint:", error);
      toast.error("Failed to update touchpoint");
    }
  };

  const saveTouchpointNotes = async () => {
    if (!order) return;

    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      const response = await axios.put(`${API}/orders/${orderId}`, {
        touchpoints: {
          ...order.touchpoints,
          notes: touchpointNotes,
        },
      });
      setOrder(response.data);
      toast.success("Notes saved");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const updateStage = async (stageKey) => {
    if (!order) return;

    const newStages = {
      ...order.stages,
      [stageKey]: !order.stages[stageKey],
    };

    setUpdating(true);
    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      const response = await axios.put(`${API}/orders/${orderId}`, {
        stages: newStages,
      });
      setOrder(response.data);
      toast.success("Order status updated");
    } catch (error) {
      console.error("Failed to update stage:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const saveReminder = async () => {
    if (!order) return;

    try {
      const response = await axios.put(`${API}/orders/${orderId}`, {
        custom_reminder: {
          days: parseInt(reminderDays) || 0,
          time: reminderTime,
          note: reminderNote,
          is_active: true,
        },
      });
      setOrder(response.data);
      toast.success("Reminder set successfully");
    } catch (error) {
      console.error("Failed to set reminder:", error);
      toast.error("Failed to set reminder");
    }
  };

  const handleArchive = async () => {
    if (!order) return;

    try {
      await axios.put(`${API}/orders/${orderId}/archive`);
      toast.success("Order archived successfully");
      navigate("/");
    } catch (error) {
      console.error("Failed to archive order:", error);
      toast.error("Failed to archive order");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="order-not-found">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate("/")} data-testid="back-to-dashboard-btn">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const totalItems = order.product_items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate days since order creation
  const orderDate = new Date(order.order_date);
  const today = new Date();
  const daysSinceOrder = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
  
  // Timeline milestones
  const maxDays = 30; // 30 days total timeline
  const milestones = [5, 10, 15, 20, 25, 30];
  const progress = Math.min((daysSinceOrder / maxDays) * 100, 100);
  
  // Color coding based on days
  const getTimelineColor = (days) => {
    if (days <= 10) return "bg-green-500";
    if (days <= 20) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getTimelineBgColor = (days) => {
    if (days <= 10) return "bg-green-100";
    if (days <= 20) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto" data-testid="order-detail-page">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-4 md:mb-6"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-medium tracking-tight" data-testid="order-customer-name">
              {order.customer_name}
            </h1>
            {order.is_high_priority && (
              <Badge className="bg-brand-gold text-white border-brand-gold w-fit" data-testid="high-priority-badge">
                <Crown className="w-4 h-4 mr-1" />
                High Priority
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleArchive}
            className="w-fit"
            data-testid="archive-order-btn"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Order
          </Button>
        </div>
        <p className="text-sm md:text-base text-muted-foreground tracking-wide">Order #{order.order_number} • {order.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-md">
            <CardHeader className="bg-secondary/20 border-b border-border/50">
              <CardTitle className="text-xl font-serif">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <p className="font-medium" data-testid="order-date">{order.order_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Email</p>
                  <p className="font-medium" data-testid="order-email">{order.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                  <p className="font-medium" data-testid="order-items">{totalItems}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="font-medium text-brand-red text-lg" data-testid="order-amount">${order.amount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Products</p>
                <div className="space-y-2">
                  {order.product_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-secondary/20 rounded-sm border border-border/50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <p className="font-medium">Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="font-medium" data-testid="order-notes">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Progress Stepper */}
          <Card className="border-border shadow-md">
            <CardHeader className="bg-secondary/20 border-b border-border/50">
              <CardTitle className="text-xl font-serif">Order Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4" data-testid="order-stages">
                {STAGES.map((stage, index) => {
                  const isCompleted = order.stages[stage.key];
                  return (
                    <div key={stage.key} className="flex items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isCompleted
                              ? "bg-brand-red border-brand-red text-white"
                              : "border-gray-300 text-gray-400"
                          }`}
                          data-testid={`stage-indicator-${stage.key}`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm">{index + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={stage.key} className="text-base font-medium cursor-pointer">
                            {stage.label}
                          </Label>
                        </div>
                      </div>
                      <Checkbox
                        id={stage.key}
                        checked={isCompleted}
                        onCheckedChange={() => updateStage(stage.key)}
                        disabled={updating}
                        data-testid={`stage-checkbox-${stage.key}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Touchpoints */}
          <Card className="border-border shadow-md">
            <CardHeader className="bg-secondary/20 border-b border-border/50">
              <CardTitle className="text-xl font-serif">Customer Touchpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4" data-testid="touchpoints-section">
              <div
                className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => updateTouchpoint("whatsapp")}
                data-testid="touchpoint-whatsapp-toggle"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle
                    className={`w-6 h-6 ${
                      order.touchpoints.whatsapp ? "text-whatsapp-green" : "text-gray-300"
                    }`}
                  />
                  <span className="font-medium">WhatsApp</span>
                </div>
                <Checkbox
                  checked={order.touchpoints.whatsapp}
                  data-testid="touchpoint-whatsapp-checkbox"
                />
              </div>

              <div
                className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => updateTouchpoint("email")}
                data-testid="touchpoint-email-toggle"
              >
                <div className="flex items-center gap-3">
                  <Mail
                    className={`w-6 h-6 ${
                      order.touchpoints.email ? "text-email-gold" : "text-gray-300"
                    }`}
                  />
                  <span className="font-medium">Email</span>
                </div>
                <Checkbox
                  checked={order.touchpoints.email}
                  data-testid="touchpoint-email-checkbox"
                />
              </div>

              <div
                className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => updateTouchpoint("crisp")}
                data-testid="touchpoint-crisp-toggle"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare
                    className={`w-6 h-6 ${
                      order.touchpoints.crisp ? "text-crisp-blue" : "text-gray-300"
                    }`}
                  />
                  <span className="font-medium">Crisp Live Chat</span>
                </div>
                <Checkbox
                  checked={order.touchpoints.crisp}
                  data-testid="touchpoint-crisp-checkbox"
                />
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <Label htmlFor="touchpoint-notes">Communication Notes</Label>
                <Textarea
                  id="touchpoint-notes"
                  value={touchpointNotes}
                  onChange={(e) => setTouchpointNotes(e.target.value)}
                  placeholder="Track what you shared with the customer..."
                  rows={4}
                  data-testid="touchpoint-notes"
                />
                <Button
                  onClick={saveTouchpointNotes}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="save-touchpoint-notes"
                >
                  Save Notes
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Total Touchpoints</p>
                <p className="text-2xl font-serif font-medium" data-testid="total-touchpoints">
                  {[order.touchpoints.whatsapp, order.touchpoints.email, order.touchpoints.crisp].filter(Boolean).length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Reminder */}
          <Card className="border-border shadow-md">
            <CardHeader className="bg-secondary/20 border-b border-border/50">
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Set Reminder
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4" data-testid="reminder-section">
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Remind me in (days)</Label>
                <Input
                  id="reminder-days"
                  type="number"
                  min="0"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  placeholder="5"
                  data-testid="reminder-days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  data-testid="reminder-time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-note">Reminder Note</Label>
                <Textarea
                  id="reminder-note"
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder={`Order #${order.order_number} - Follow up needed`}
                  rows={3}
                  data-testid="reminder-note"
                />
              </div>

              <Button
                onClick={saveReminder}
                className="w-full"
                data-testid="save-reminder"
              >
                Set Reminder
              </Button>

              {order.custom_reminder && order.custom_reminder.is_active && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <p className="text-sm font-medium text-yellow-800">Active Reminder</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    In {order.custom_reminder.days} days {order.custom_reminder.time && `at ${order.custom_reminder.time}`}
                  </p>
                  {order.custom_reminder.note && (
                    <p className="text-xs text-yellow-700 mt-1">{order.custom_reminder.note}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compact Order Age Timeline - Bottom */}
      <Card className={`border ${getTimelineBgColor(daysSinceOrder)} mt-6`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order Age</p>
                <p className="text-xl font-serif font-medium">
                  {daysSinceOrder} {daysSinceOrder === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="border-l border-border/50 pl-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium">
                  {daysSinceOrder <= 10 && "✓ On Track"}
                  {daysSinceOrder > 10 && daysSinceOrder <= 20 && "⚠ Monitor"}
                  {daysSinceOrder > 20 && "⚠ Attention"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Placed {new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {daysSinceOrder <= 5 && (
                <Badge variant="outline" className="text-xs mt-1">Should be in Embroidery</Badge>
              )}
              {daysSinceOrder > 5 && daysSinceOrder <= 10 && (
                <Badge variant="outline" className="text-xs mt-1">Should be Customizing</Badge>
              )}
              {daysSinceOrder > 10 && daysSinceOrder <= 15 && (
                <Badge variant="outline" className="text-xs mt-1 bg-yellow-50">Ready to Dispatch</Badge>
              )}
              {daysSinceOrder > 15 && daysSinceOrder <= 21 && (
                <Badge variant="outline" className="text-xs mt-1 bg-yellow-50">Should be Dispatched</Badge>
              )}
              {daysSinceOrder > 21 && (
                <Badge variant="outline" className="text-xs mt-1 bg-red-50 text-red-700 border-red-300">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Compact Timeline */}
          <div className="space-y-1.5">
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${getTimelineColor(daysSinceOrder)} transition-all duration-500 rounded-full`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="relative h-6">
              <div className="absolute inset-0 flex justify-between items-center">
                {milestones.map((milestone, index) => {
                  const isReached = daysSinceOrder >= milestone;
                  const isCurrent = daysSinceOrder >= milestone && (index === milestones.length - 1 || daysSinceOrder < milestones[index + 1]);
                  const position = (milestone / maxDays) * 100;
                  
                  return (
                    <div 
                      key={milestone}
                      className="flex flex-col items-center"
                      style={{ position: 'absolute', left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full transition-all ${
                          isReached 
                            ? `${getTimelineColor(milestone)}` 
                            : 'bg-gray-300'
                        } ${isCurrent ? 'w-2.5 h-2.5 ring-1 ring-offset-1 ring-brand-gold' : ''}`}
                      />
                      <span className={`text-[10px] mt-0.5 ${isReached ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {milestone}d
                      </span>
                    </div>
                  );
                })}
              </div>

              {daysSinceOrder < maxDays && (
                <div 
                  className="absolute top-0"
                  style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-3 h-3 rounded-full ${getTimelineColor(daysSinceOrder)} border-2 border-white shadow animate-pulse`} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
