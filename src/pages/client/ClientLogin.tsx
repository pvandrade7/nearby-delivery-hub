import { ShoppingBag } from "lucide-react";
import { AuthFlow } from "@/components/AuthFlow";

const ClientLogin = () => {
  return (
    <AuthFlow
      title="Entrar como Cliente"
      subtitle="Acesse sua conta para comprar em lojas locais da sua cidade."
      icon={ShoppingBag}
      finalPath="/cliente/home"
      profileTitle="Dados do cliente"
      detailsTitle="Endereço de entrega"
      detailsSubtitle="Informe onde deseja receber seus pedidos."
      fields={[
        { name: "address", label: "Endereço", placeholder: "Rua, número e bairro" },
        { name: "city", label: "Cidade", placeholder: "Ex: São Paulo" },
        { name: "reference", label: "Complemento ou referência", placeholder: "Apto, bloco, ponto de referência" },
      ]}
    />
  );
};

export default ClientLogin;