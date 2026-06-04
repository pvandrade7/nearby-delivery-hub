import { lazy, Suspense } from "react";
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
import { NavSync } from "@/components/NavSync";

// ── Páginas carregadas sob demanda (code splitting) ──────────
// Cada grupo de rotas gera um chunk separado no build.

// Core (carregadas em toda sessão — mantidas eager)
import Auth      from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";
import NotFound   from "./pages/NotFound";

// Cliente
const ClientLogin       = lazy(() => import("./pages/client/ClientLogin"));
const ClientHome        = lazy(() => import("./pages/client/ClientHome"));
const ClientSearch      = lazy(() => import("./pages/client/ClientSearch"));
const StoreList         = lazy(() => import("./pages/client/StoreList"));
const StoreDetail       = lazy(() => import("./pages/client/StoreDetail"));
const ProductDetail     = lazy(() => import("./pages/client/ProductDetail"));
const Cart              = lazy(() => import("./pages/client/Cart"));
const Checkout          = lazy(() => import("./pages/client/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/client/OrderConfirmation"));
const OrderTracking     = lazy(() => import("./pages/client/OrderTracking"));
const ClientOrders      = lazy(() => import("./pages/client/ClientOrders"));
const ClientProfile     = lazy(() => import("./pages/client/ClientProfile"));
const SavedAddresses    = lazy(() => import("./pages/client/SavedAddresses"));
const PaymentMethods    = lazy(() => import("./pages/client/PaymentMethods"));
const Favorites         = lazy(() => import("./pages/client/Favorites"));
const Help              = lazy(() => import("./pages/client/Help"));
const SellerChat        = lazy(() => import("./pages/client/SellerChat"));
const Conversations     = lazy(() => import("./pages/client/Conversations"));

// Lojista
const SellerLogin       = lazy(() => import("./pages/seller/SellerLogin"));
const CreateStore       = lazy(() => import("./pages/seller/CreateStore"));
const SellerDashboard   = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts    = lazy(() => import("./pages/seller/SellerProducts"));
const NewProduct        = lazy(() => import("./pages/seller/NewProduct"));
const SellerOrders      = lazy(() => import("./pages/seller/SellerOrders"));
const SellerVerification = lazy(() => import("./pages/seller/SellerVerification"));
const SellerConfig      = lazy(() => import("./pages/seller/SellerConfig"));
const MyStore           = lazy(() => import("./pages/seller/MyStore"));

// Admin
const AdminDashboard    = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminVerification = lazy(() => import("./pages/admin/AdminVerification"));
const AdminSupport      = lazy(() => import("./pages/admin/AdminSupport"));
const AdminTicket       = lazy(() => import("./pages/admin/AdminTicket"));
const AdminStores       = lazy(() => import("./pages/admin/AdminStores"));
const AdminAuditLog     = lazy(() => import("./pages/admin/AdminAuditLog"));

// Entregador
const CourierLogin      = lazy(() => import("./pages/courier/CourierLogin"));
const CourierHome       = lazy(() => import("./pages/courier/CourierHome"));
const CourierRoute      = lazy(() => import("./pages/courier/CourierRoute"));
const CourierComplete   = lazy(() => import("./pages/courier/CourierComplete"));
const CourierProfile    = lazy(() => import("./pages/courier/CourierProfile"));

// Apresentação
const Apresentacao      = lazy(() => import("./pages/Apresentacao"));
const Celular           = lazy(() => import("./pages/Celular"));

// ── Fallback de carregamento ─────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] gap-3 text-sm text-muted-foreground">
    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    Carregando...
  </div>
);

const queryClient = new QueryClient();

// ── Guards de rota por role ──────────────────────────────────
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
  if (loading) return <PageLoader />;
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Páginas de apresentação — sem AppShell, sem auth */}
                <Route path="/apresentacao" element={<Apresentacao />} />
                <Route path="/celular"      element={<Celular />} />
                <Route path="/auth" element={<AppShell><Auth /></AppShell>} />
                <Route path="/" element={<AppShell><RoleSelect /></AppShell>} />

                {/* Cliente */}
                <Route path="/cliente" element={<AppShell><ClientLogin /></AppShell>} />
                <Route path="/cliente/home"         element={<AppShell><Client><ClientHome /></Client></AppShell>} />
                <Route path="/cliente/busca"         element={<AppShell><Client><ClientSearch /></Client></AppShell>} />
                <Route path="/cliente/lojas"         element={<AppShell><Client><StoreList /></Client></AppShell>} />
                <Route path="/cliente/loja/:id"      element={<AppShell><Client><StoreDetail /></Client></AppShell>} />
                <Route path="/cliente/produto/:id"   element={<AppShell><Client><ProductDetail /></Client></AppShell>} />
                <Route path="/cliente/chat/:productId" element={<AppShell><Client><SellerChat /></Client></AppShell>} />
                <Route path="/cliente/conversas"     element={<AppShell><Client><Conversations /></Client></AppShell>} />
                <Route path="/cliente/carrinho"      element={<AppShell><Client><Cart /></Client></AppShell>} />
                <Route path="/cliente/checkout"      element={<AppShell><Client><Checkout /></Client></AppShell>} />
                <Route path="/cliente/confirmacao"   element={<AppShell><Client><OrderConfirmation /></Client></AppShell>} />
                <Route path="/cliente/rastreamento/:id" element={<AppShell><Client><OrderTracking /></Client></AppShell>} />
                <Route path="/cliente/pedidos"       element={<AppShell><Client><ClientOrders /></Client></AppShell>} />
                <Route path="/cliente/perfil"        element={<AppShell><Client><ClientProfile /></Client></AppShell>} />
                <Route path="/cliente/enderecos"     element={<AppShell><Client><SavedAddresses /></Client></AppShell>} />
                <Route path="/cliente/pagamento"     element={<AppShell><Client><PaymentMethods /></Client></AppShell>} />
                <Route path="/cliente/favoritos"     element={<AppShell><Client><Favorites /></Client></AppShell>} />
                <Route path="/cliente/ajuda"         element={<AppShell><Client><Help /></Client></AppShell>} />

                {/* Lojista */}
                <Route path="/lojista" element={<AppShell><SellerLogin /></AppShell>} />
                <Route path="/lojista/criar-loja"   element={<OnboardingLayout step={2}><Seller><CreateStore /></Seller></OnboardingLayout>} />
                <Route path="/lojista/verificacao"  element={<AppShell><Seller><SellerVerification /></Seller></AppShell>} />
                <Route path="/lojista/painel"       element={<AppShell><VerifiedSeller><SellerDashboard /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/produtos"     element={<AppShell><VerifiedSeller><SellerProducts /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/produtos/novo"         element={<AppShell><VerifiedSeller><NewProduct /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/produtos/editar/:id"   element={<AppShell><VerifiedSeller><NewProduct /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/pedidos"      element={<AppShell><VerifiedSeller><SellerOrders /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/config"       element={<AppShell><VerifiedSeller><SellerConfig /></VerifiedSeller></AppShell>} />
                <Route path="/lojista/minha-loja"   element={<AppShell><VerifiedSeller><MyStore /></VerifiedSeller></AppShell>} />

                {/* Admin */}
                <Route path="/admin/painel"        element={<AppShell><Admin><AdminDashboard    /></Admin></AppShell>} />
                <Route path="/admin/verificacoes"  element={<AppShell><Admin><AdminVerification /></Admin></AppShell>} />
                <Route path="/admin/suporte"       element={<AppShell><Admin><AdminSupport      /></Admin></AppShell>} />
                <Route path="/admin/ticket/:id"    element={<AppShell><Admin><AdminTicket       /></Admin></AppShell>} />
                <Route path="/admin/logs"          element={<AppShell><Admin><AdminAuditLog     /></Admin></AppShell>} />
                <Route path="/admin/usuarios"      element={<AppShell><Admin><AdminDashboard    /></Admin></AppShell>} />
                <Route path="/admin/lojas"         element={<AppShell><Admin><AdminStores       /></Admin></AppShell>} />

                {/* Entregador */}
                <Route path="/entregador"              element={<AppShell><CourierLogin /></AppShell>} />
                <Route path="/entregador/painel"       element={<AppShell><Courier><CourierHome     /></Courier></AppShell>} />
                <Route path="/entregador/corrida/:id"  element={<AppShell><Courier><CourierRoute    /></Courier></AppShell>} />
                <Route path="/entregador/finalizada"   element={<AppShell><Courier><CourierComplete /></Courier></AppShell>} />
                <Route path="/entregador/perfil"       element={<AppShell><Courier><CourierProfile  /></Courier></AppShell>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
