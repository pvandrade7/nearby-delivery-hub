import { useState } from "react";
import { BadgeCheck, Ban, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { verificationRequests } from "@/data/mockData";

type Status = "nao_verificado" | "pendente" | "verificado" | "rejeitado";

const statusStyle: Record<Status, string> = {
  nao_verificado: "bg-muted text-muted-foreground",
  pendente: "bg-warning/20 text-warning-foreground",
  verificado: "bg-success/15 text-success",
  rejeitado: "bg-destructive/10 text-destructive",
};

const AdminVerification = () => {
  const [requests, setRequests] = useState(verificationRequests);

  const setStatus = (id: string, status: Status) => {
    setRequests((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administração</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold mt-1">Verificação de vendedores</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pendentes", value: requests.filter((item) => item.status === "pendente").length, icon: BadgeCheck },
          { label: "Verificados", value: requests.filter((item) => item.status === "verificado").length, icon: CheckCircle2 },
          { label: "Rejeitados", value: requests.filter((item) => item.status === "rejeitado").length, icon: XCircle },
          { label: "Revogáveis", value: requests.filter((item) => item.status === "verificado").length, icon: RotateCcw },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-card">
            <stat.icon className="w-5 h-5 text-primary" />
            <p className="text-3xl font-extrabold mt-3">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-border">
          <h2 className="font-bold text-base">Solicitações manuais</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-bold px-5 lg:px-6 py-3">Loja</th>
                <th className="text-left font-bold px-3 py-3">Provas</th>
                <th className="text-left font-bold px-3 py-3">Status</th>
                <th className="text-right font-bold px-5 lg:px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 lg:px-6 py-4">
                    <p className="font-extrabold">{request.storeName}</p>
                    <p className="text-xs text-muted-foreground">{request.sellerName} · enviado {request.submittedAt}</p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {request.proofs.map((proof) => (
                        <span key={proof} className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                          {proof}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle[request.status as Status]}`}>
                      {request.status.replace("nao_", "não ")}
                    </span>
                  </td>
                  <td className="px-5 lg:px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setStatus(request.id, "verificado")} className="size-9 rounded-lg bg-success/15 text-success flex items-center justify-center" aria-label="Aprovar">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStatus(request.id, "rejeitado")} className="size-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center" aria-label="Rejeitar">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStatus(request.id, "nao_verificado")} className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center" aria-label="Revogar">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVerification;
