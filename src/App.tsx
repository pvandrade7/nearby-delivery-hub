import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireRole } from "@/components/RequireRole";
import Auth from "./pages/Auth";
import Conversations from "./pages/client/Conversations";
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
import SavedAddresses from "./pages/client/SavedAddresses";
import PaymentMethods from "./pages/client/PaymentMethods";
import Favorites from "./pages/client/Favorites";
import Help from "./pages/client/Help";
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
import CourierProfile from "./pages/courier/CourierProfile";

const queryClient = new QueryClient();

// ── Guards de rota por role ──────────────────────────────
const Client = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="cliente" redirectTo="/cliente">{children}</RequireRole>
);
const Seller = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="lojista" redirectTo="/lojista">{children}</RequireRole>
);
const Courier = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="entregador" redirectTo="/entregador">{children}</RequireRole>
);
// Admin aceita role 'admin' ou 'lojista' (gestor com acesso ampliado)
const Admin = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role={["admin", "lojista"]} redirectTo="/lojista">{children}</RequireRole>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AppShell><Auth /></AppShell>} />
              <Route path="/" element={<AppShell><RoleSelect /></AppShell>} />

              {/* Cliente — público até home, ações sensíveis exigem role=cliente */}
              <Route path="/cliente" element={<AppShell><ClientLogin /></AppShell>} />
              <Route path="/cliente/home" element={<AppShell><Client><ClientHome /></Client></AppShell>} />
              <Route path="/cliente/busca" element={<AppShell><Client><ClientSearch /></Client></AppShell>} />
              <Route path="/cliente/lojas" element={<AppShell><Client><StoreList /></Client></AppShell>} />
              <Route path="/cliente/loja/:id" element={<AppShell><Client><StoreDetail /></Client></AppShell>} />
              <Route path="/cliente/produto/:id" element={<AppShell><Client><ProductDetail /></Client></AppShell>} />
              <Route path="/cliente/chat/:productId" element={<AppShell><Client><SellerChat /></Client></AppShell>} />
              <Route path="/cliente/conversas" element={<AppShell><Client><Conversations /></Client></AppShell>} />
              <Route path="/cliente/carrinho" element={<AppShell><Client><Cart /></Client></AppShell>} />
              <Route path="/cliente/checkout" element={<AppShell><Client><Checkout /></Client></AppShell>} />
              <Route path="/cliente/confirmacao" element={<AppShell><Client><OrderConfirmation /></Client></AppShell>} />
              <Route path="/cliente/rastreamento/:id" element={<AppShell><Client><OrderTracking /></Client></AppShell>} />
              <Route path="/cliente/pedidos" element={<AppShell><Client><ClientOrders /></Client></AppShell>} />
              <Route path="/cliente/perfil" element={<AppShell><Client><ClientProfile /></Client></AppShell>} />
              <Route path="/cliente/enderecos" element={<AppShell><Client><SavedAddresses /></Client></AppShell>} />
              <Route path="/cliente/pagamento" element={<AppShell><Client><PaymentMethods /></Client></AppShell>} />
              <Route path="/cliente/favoritos" element={<AppShell><Client><Favorites /></Client></AppShell>} />
              <Route path="/cliente/ajuda" element={<AppShell><Client><Help /></Client></AppShell>} />

              {/* Lojista — tudo protegido por role=lojista exceto login */}
              <Route path="/lojista" element={<AppShell><SellerLogin /></AppShell>} />
              <Route path="/lojista/criar-loja" element={<AppShell><Seller><CreateStore /></Seller></AppShell>} />
              <Route path="/lojista/painel" element={<AppShell><Seller><SellerDashboard /></Seller></AppShell>} />
              <Route path="/lojista/produtos" element={<AppShell><Seller><SellerProducts /></Seller></AppShell>} />
              <Route path="/lojista/produtos/novo" element={<AppShell><Seller><NewProduct /></Seller></AppShell>} />
              <Route path="/lojista/pedidos" element={<AppShell><Seller><SellerOrders /></Seller></AppShell>} />
              <Route path="/lojista/verificacao" element={<AppShell><Seller><SellerVerification /></Seller></AppShell>} />
              <Route path="/lojista/config" element={<AppShell><Seller><SellerDashboard /></Seller></AppShell>} />

              {/* Admin */}
              <Route path="/admin/verificacoes" element={<AppShell><Admin><AdminVerification /></Admin></AppShell>} />

              {/* Entregador — tudo protegido por role=entregador exceto login */}
              <Route path="/entregador" element={<AppShell><CourierLogin /></AppShell>} />
              <Route path="/entregador/painel" element={<AppShell><Courier><CourierHome /></Courier></AppShell>} />
              <Route path="/entregador/corrida/:id" element={<AppShell><Courier><CourierRoute /></Courier></AppShell>} />
              <Route path="/entregador/finalizada" element={<AppShell><Courier><CourierComplete /></Courier></AppShell>} />
              <Route path="/entregador/perfil" element={<AppShell><Courier><CourierProfile /></Courier></AppShell>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
