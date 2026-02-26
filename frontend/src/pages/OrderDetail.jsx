import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, MessageSquare, Crown, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STAGES = [
  { key: "in_embroidery", label: "In Embroidery" },
  { key: "customizing", label: "Customizing" },
  { key: "washing", label: "Washing" },
  { key: "ready_to_dispatch", label: "Ready to Dispatch" },
  { key: "sent_to_delhi", label: "Sent to Delhi (Xportel)" },
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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
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
    };

    try {
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

  const updateStage = async (stageKey) => {
    if (!order) return;

    const newStages = {
      ...order.stages,
      [stageKey]: !order.stages[stageKey],
    };

    setUpdating(true);
    try {
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

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto" data-testid="order-detail-page">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight" data-testid="order-customer-name">
            {order.customer_name}
          </h1>
          {order.is_high_priority && (
            <Badge className="bg-brand-gold text-white border-brand-gold" data-testid="high-priority-badge">
              <Crown className="w-4 h-4 mr-1" />
              High Priority
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground tracking-wide">Order ID: {order.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="font-medium" data-testid="order-product">{order.product_items}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">SKU</p>
                  <p className="font-medium" data-testid="order-sku">{order.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p className="font-medium" data-testid="order-quantity">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="font-medium text-brand-red text-lg" data-testid="order-amount">${order.amount.toFixed(2)}</p>
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

        {/* Touchpoints */}
        <div>
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

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Total Touchpoints</p>
                <p className="text-2xl font-serif font-medium" data-testid="total-touchpoints">
                  {[order.touchpoints.whatsapp, order.touchpoints.email, order.touchpoints.crisp].filter(Boolean).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
