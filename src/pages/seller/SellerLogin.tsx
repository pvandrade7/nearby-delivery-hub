import { Store } from "lucide-react";
import { AuthFlow } from "@/components/AuthFlow";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";

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
        { name: "storeName", label: "Nome da loja", placeholder: "Ex: Tech Zone Acessórios" },
        {
          name: "storeCategory",
          label: "Categoria principal",
          placeholder: "Descreva sua categoria",
          options: [...SELLER_CATEGORIES],
        },
        { name: "address", label: "Endereço comercial", placeholder: "Rua, número e bairro" },
      ]}
    />
  );
};

export default SellerLogin;
