import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import CreateOrder from "@/pages/CreateOrder";
import OrderDetail from "@/pages/OrderDetail";
import Analytics from "@/pages/Analytics";
import Layout from "@/components/Layout";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-order" element={<CreateOrder />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
