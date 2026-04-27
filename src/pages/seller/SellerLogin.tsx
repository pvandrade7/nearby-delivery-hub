import { Store } from "lucide-react";
import { AuthFlow } from "@/components/AuthFlow";

const SellerLogin = () => {
  return (
    <AuthFlow
      title="Entrar como Lojista"
      subtitle="Acesse sua conta para vender seus produtos online."
      icon={Store}
      finalPath="/lojista/criar-loja"
      profileTitle="Dados do responsável"
      detailsTitle="Dados da loja"
      detailsSubtitle="Adicione informações básicas para configurar sua vitrine."
      fields={[
        { name: "storeName", label: "Nome da loja", placeholder: "Ex: Casa Forte Materiais" },
        { name: "category", label: "Categoria principal", placeholder: "Construção, farmácia, utilidades..." },
        { name: "address", label: "Endereço comercial", placeholder: "Rua, número e bairro" },
      ]}
    />
  );
};

export default SellerLogin;
