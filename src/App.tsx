import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireRole } from "@/components/RequireRole";
import { OnboardingLayout } from "@/components/OnboardingLayout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
import SellerConfig from "./pages/seller/SellerConfig";
import MyStore from "./pages/seller/MyStore";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminDashboard    from "./pages/admin/AdminDashboard";
import AdminSupport      from "./pages/admin/AdminSupport";
import AdminTicket       from "./pages/admin/AdminTicket";

// Entregador
import CourierHome from "./pages/courier/CourierHome";
import CourierLogin from "./pages/courier/CourierLogin";
import CourierRoute from "./pages/courier/CourierRoute";
import CourierComplete from "./pages/courier/CourierComplete";
import CourierProfile from "./pages/courier/CourierProfile";

// Apresentação
import Apresentacao from "./pages/Apresentacao";
import Celular from "./pages/Celular";
import { NavSync } from "./components/NavSync";

const queryClient = new QueryClient();

// ── Guards de rota por role ──────────────────────────────
const Client = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="cliente" redirectTo="/cliente">{children}</RequireRole>
);
const Seller = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="lojista" redirectTo="/lojista">{children}</RequireRole>
);
// VerifiedSeller: exige role=lojista E verified=true.
// Lojistas com conta pendente/rejeitada são redirecionados para /lojista/verificacao.
const VerifiedSeller = ({ children }: { children: React.ReactNode }) => {
  const { session, roles, verified, loading, isDemo } = useAuth();
  if (isDemo) return <>{children}</>;
  if (loading) return <div className="flex items-center justify-center h-screen gap-3 text-sm text-muted-foreground"><div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />Carregando...</div>;
  if (!session) return <Navigate to="/lojista" replace />;
  if (!roles.some((r) => r === "lojista")) return <Navigate to="/lojista" replace />;
  if (!verified) return <Navigate to="/lojista/verificacao" replace />;
  return <>{children}</>;
};
const Courier = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="entregador" redirectTo="/entregador">{children}</RequireRole>
);
// Admin: somente role 'admin', somente desktop. Sem acesso admin via role lojista.
const Admin = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  if (isMobile) return <Navigate to="/" replace />;
  return <RequireRole role="admin" redirectTo="/lojista">{children}</RequireRole>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <NavSync />
            <Routes>
              {/* Páginas de apresentação — sem AppShell, sem auth, layout próprio */}
              <Route path="/apresentacao" element={<Apresentacao />} />
              <Route path="/celular"      element={<Celular />} />
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

              {/* Lojista — login público */}
              <Route path="/lojista" element={<AppShell><SellerLogin /></AppShell>} />
              {/* Criar loja: onboarding sem sidebar */}
              <Route path="/lojista/criar-loja" element={<OnboardingLayout step={2}><Seller><CreateStore /></Seller></OnboardingLayout>} />
              {/* Verificação: AppShell normal — lojistas verificados acessam via sidebar */}
              <Route path="/lojista/verificacao" element={<AppShell><Seller><SellerVerification /></Seller></AppShell>} />
              {/* Rotas sensíveis: exigem role=lojista E verified=true */}
              <Route path="/lojista/painel" element={<AppShell><VerifiedSeller><SellerDashboard /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/produtos" element={<AppShell><VerifiedSeller><SellerProducts /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/produtos/novo" element={<AppShell><VerifiedSeller><NewProduct /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/produtos/editar/:id" element={<AppShell><VerifiedSeller><NewProduct /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/pedidos" element={<AppShell><VerifiedSeller><SellerOrders /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/config" element={<AppShell><VerifiedSeller><SellerConfig /></VerifiedSeller></AppShell>} />
              <Route path="/lojista/minha-loja" element={<AppShell><VerifiedSeller><MyStore /></VerifiedSeller></AppShell>} />

              {/* Admin */}
              <Route path="/admin/painel"        element={<AppShell><Admin><AdminDashboard    /></Admin></AppShell>} />
              <Route path="/admin/verificacoes"  element={<AppShell><Admin><AdminVerification /></Admin></AppShell>} />
              <Route path="/admin/suporte"       element={<AppShell><Admin><AdminSupport      /></Admin></AppShell>} />
              <Route path="/admin/ticket/:id"    element={<AppShell><Admin><AdminTicket       /></Admin></AppShell>} />
              {/* Rotas admin stub (para nav funcionar sem página 404) */}
              <Route path="/admin/usuarios"      element={<AppShell><Admin><AdminDashboard    /></Admin></AppShell>} />
              <Route path="/admin/lojas"         element={<AppShell><Admin><AdminVerification /></Admin></AppShell>} />

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
