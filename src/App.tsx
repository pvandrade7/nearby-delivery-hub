import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";
import RoleSelect from "./pages/RoleSelect";
import NotFound from "./pages/NotFound.tsx";

// Cliente
import ClientHome from "./pages/client/ClientHome";
import ClientSearch from "./pages/client/ClientSearch";
import StoreList from "./pages/client/StoreList";
import StoreDetail from "./pages/client/StoreDetail";
import ProductDetail from "./pages/client/ProductDetail";
import Cart from "./pages/client/Cart";
import Checkout from "./pages/client/Checkout";
import OrderConfirmation from "./pages/client/OrderConfirmation";
import OrderTracking from "./pages/client/OrderTracking";
import ClientOrders from "./pages/client/ClientOrders";
import ClientProfile from "./pages/client/ClientProfile";
import ClientLogin from "./pages/client/ClientLogin";
import SellerChat from "./pages/client/SellerChat";

// Lojista
import SellerLogin from "./pages/seller/SellerLogin";
import CreateStore from "./pages/seller/CreateStore";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import NewProduct from "./pages/seller/NewProduct";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerVerification from "./pages/seller/SellerVerification";
import AdminVerification from "./pages/admin/AdminVerification";

// Entregador
import CourierHome from "./pages/courier/CourierHome";
import CourierLogin from "./pages/courier/CourierLogin";
import CourierRoute from "./pages/courier/CourierRoute";
import CourierComplete from "./pages/courier/CourierComplete";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AppShell>
                  <RoleSelect />
                </AppShell>
              }
            />

            {/* Cliente */}
            <Route path="/cliente" element={<AppShell><ClientLogin /></AppShell>} />
            <Route path="/cliente/home" element={<AppShell><ClientHome /></AppShell>} />
            <Route path="/cliente/busca" element={<AppShell><ClientSearch /></AppShell>} />
            <Route path="/cliente/lojas" element={<AppShell><StoreList /></AppShell>} />
            <Route path="/cliente/loja/:id" element={<AppShell><StoreDetail /></AppShell>} />
            <Route path="/cliente/produto/:id" element={<AppShell><ProductDetail /></AppShell>} />
            <Route path="/cliente/chat/:productId" element={<AppShell><SellerChat /></AppShell>} />
            <Route path="/cliente/carrinho" element={<AppShell><Cart /></AppShell>} />
            <Route path="/cliente/checkout" element={<AppShell><Checkout /></AppShell>} />
            <Route path="/cliente/confirmacao" element={<AppShell><OrderConfirmation /></AppShell>} />
            <Route path="/cliente/rastreamento/:id" element={<AppShell><OrderTracking /></AppShell>} />
            <Route path="/cliente/pedidos" element={<AppShell><ClientOrders /></AppShell>} />
            <Route path="/cliente/perfil" element={<AppShell><ClientProfile /></AppShell>} />

            {/* Lojista */}
            <Route path="/lojista" element={<AppShell><SellerLogin /></AppShell>} />
            <Route path="/lojista/criar-loja" element={<AppShell><CreateStore /></AppShell>} />
            <Route path="/lojista/painel" element={<AppShell><SellerDashboard /></AppShell>} />
            <Route path="/lojista/produtos" element={<AppShell><SellerProducts /></AppShell>} />
            <Route path="/lojista/produtos/novo" element={<AppShell><NewProduct /></AppShell>} />
            <Route path="/lojista/pedidos" element={<AppShell><SellerOrders /></AppShell>} />
            <Route path="/lojista/verificacao" element={<AppShell><SellerVerification /></AppShell>} />
            <Route path="/lojista/config" element={<AppShell><SellerDashboard /></AppShell>} />

            {/* Admin */}
            <Route path="/admin/verificacoes" element={<AppShell><AdminVerification /></AppShell>} />

            {/* Entregador */}
            <Route path="/entregador" element={<AppShell><CourierLogin /></AppShell>} />
            <Route path="/entregador/painel" element={<AppShell><CourierHome /></AppShell>} />
            <Route path="/entregador/corrida/:id" element={<AppShell><CourierRoute /></AppShell>} />
            <Route path="/entregador/finalizada" element={<AppShell><CourierComplete /></AppShell>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
