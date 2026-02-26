import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MessageCircle, 
  Mail, 
  MessageSquare, 
  Crown,
  Trash2,
  AlertTriangle,
  Archive
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
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

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const handleDeleteSingle = (order) => {
    setOrderToDelete(order);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSingle = async () => {
    if (!orderToDelete) return;

    try {
      const API = "https://cs-ultra-backend.onrender.com/api";
      await axios.delete(`${API}/orders/${orderToDelete.id}`);
      toast.success(`Order #${orderToDelete.order_number} deleted`);
      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      setShowDeleteDialog(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to delete");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const handleBulkArchive = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to archive");
      return;
    }

    try {
      await axios.post(`${API}/orders/bulk-archive`, selectedOrders);
      toast.success(`${selectedOrders.length} orders archived`);
      setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
    } catch (error) {
      console.error("Failed to archive orders:", error);
      toast.error("Failed to archive orders");
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await axios.post(`${API}/orders/bulk-delete`, selectedOrders);
      toast.success(`${selectedOrders.length} orders deleted`);
      setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete orders:", error);
      toast.error("Failed to delete orders");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto" data-testid="manage-orders-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <h1 className="text-3xl font-serif font-medium tracking-tight">Manage Orders</h1>
        </div>
        <p className="text-muted-foreground text-sm">Delete orders to declutter your dashboard</p>
      </div>

      {/* Action Bar */}
      {selectedOrders.length > 0 && (
        <Card className="mb-6 border-destructive bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedOrders.length === orders.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="font-medium">
                  {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkArchive}
                  data-testid="bulk-archive-btn"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Selected
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  data-testid="bulk-delete-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Banner */}
      <Card className="mb-6 border-yellow-500 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Warning: Permanent Deletion</p>
              <p className="text-sm text-yellow-800 mt-1">
                Deleted orders cannot be recovered. Make sure you have exported or backed up any important data before deleting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-border">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-serif">All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No orders to manage</p>
              <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium w-12">
                      <Checkbox 
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Items</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {orders.map((order) => {
                    const status = getOrderStatus(order.stages);
                    const totalItems = order.product_items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <tr 
                        key={order.id}
                        className="hover:bg-secondary/10 transition-colors"
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
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSingle(order)}
                            className="text-destructive hover:text-destructive hover:bg-red-50"
                            data-testid={`delete-order-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Single Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>#{orderToDelete?.order_number}</strong> for <strong>{orderToDelete?.customer_name}</strong>?
              <br /><br />
              This action cannot be undone. The order data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSingle}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedOrders.length} Orders?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedOrders.length}</strong> selected order{selectedOrders.length !== 1 ? 's' : ''}?
              <br /><br />
              This action cannot be undone. All selected order data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete {selectedOrders.length} Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
