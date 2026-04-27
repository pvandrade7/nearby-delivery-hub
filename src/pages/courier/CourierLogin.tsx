import { Bike } from "lucide-react";
import { AuthFlow } from "@/components/AuthFlow";

const CourierLogin = () => {
  return (
    <AuthFlow
      title="Entrar como Entregador"
      subtitle="Acesse sua conta para aceitar corridas e acompanhar seus ganhos."
      icon={Bike}
      finalPath="/entregador/painel"
      profileTitle="Dados do entregador"
      detailsTitle="Dados de operação"
      detailsSubtitle="Informe como você costuma realizar as entregas."
      fields={[
        { name: "vehicle", label: "Veículo", placeholder: "Moto, bicicleta, carro ou a pé" },
        { name: "document", label: "CPF ou documento", placeholder: "000.000.000-00", maxLength: 18 },
        { name: "region", label: "Região de atuação", placeholder: "Bairros ou cidade onde entrega" },
      ]}
    />
  );
};

export default CourierLogin;