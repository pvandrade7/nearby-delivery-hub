import { Store } from "lucide-react";
import { AuthFlow } from "@/components/AuthFlow";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";

const SellerLogin = () => {
  return (
    <AuthFlow
      title="Cadastrar meu negócio"
      subtitle="Coloque sua loja no mapa e venda para clientes da sua região."
      icon={Store}
      finalPath="/lojista/criar-loja"
      profileTitle="Dados do responsável"
      detailsTitle="Sobre o seu negócio"
      detailsSubtitle="Preencha as informações da sua loja ou empreendimento local."
      fields={[
        { name: "storeName", label: "Nome do negócio", placeholder: "Ex: Sampaio Cell, Bazar da Maria..." },
        {
          name: "storeCategory",
          label: "Segmento principal",
          placeholder: "Descreva o seu segmento",
          options: [...SELLER_CATEGORIES],
        },
        { name: "address", label: "Endereço comercial", placeholder: "Rua, número e bairro" },
      ]}
    />
  );
};

export default SellerLogin;
