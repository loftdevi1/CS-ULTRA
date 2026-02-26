import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_number: "",
    order_date: new Date().toISOString().split('T')[0],
    customer_name: "",
    customer_email: "",
    amount: 0,
    notes: "",
  });
  const [productItems, setProductItems] = useState([{ name: "", quantity: 1, sku: "" }]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...productItems];
    updated[index][field] = field === "quantity" ? parseInt(value) || 1 : value;
    setProductItems(updated);
  };

  const addProductItem = () => {
    setProductItems([...productItems, { name: "", quantity: 1, sku: "" }]);
  };

  const removeProductItem = (index) => {
    if (productItems.length > 1) {
      setProductItems(productItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all product items are filled
    const invalidItems = productItems.some(item => !item.name || !item.sku);
    if (invalidItems) {
      toast.error("Please fill all product item fields");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        product_items: productItems,
      };
      const response = await axios.post(`${API}/orders`, payload);
      toast.success("Order created successfully!");
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error(error.response?.data?.detail || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto" data-testid="create-order-page">
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
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-2" data-testid="page-title">
          Create New Order
        </h1>
        <p className="text-muted-foreground tracking-wide">Enter order details manually</p>
      </div>

      <Card className="border-border shadow-md">
        <CardHeader className="bg-secondary/20 border-b border-border/50">
          <CardTitle className="text-xl font-serif">Order Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={handleChange}
                  required
                  data-testid="input-order-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  data-testid="input-customer-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  data-testid="input-customer-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_items">Product Items</Label>
                <Input
                  id="product_items"
                  name="product_items"
                  value={formData.product_items}
                  onChange={handleChange}
                  placeholder="Hand Embroidered Shawl"
                  required
                  data-testid="input-product-items"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="SHWL-001"
                  required
                  data-testid="input-sku"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  data-testid="input-amount"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions or notes..."
                rows={4}
                data-testid="input-notes"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} data-testid="submit-button">
                {loading ? "Creating..." : "Create Order"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={loading}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
