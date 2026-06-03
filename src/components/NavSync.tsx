import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * NavSync — sincroniza a navegação do React Router com o frame pai quando
 * a aplicação está sendo exibida dentro de um <iframe> (página de apresentação).
 *
 * Fluxo:
 *  iframe navega → postMessage("vendy_nav") → pai → postMessage("vendy_navigate") → outro iframe
 *
 * Fora de um iframe este componente não faz nada (renderiza null).
 */
export const NavSync = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const inIframe  = window !== window.parent;

  // Informa o frame pai sempre que o pathname mudar
  useEffect(() => {
    if (!inIframe) return;
    // Pequeno debounce evita mensagens duplicadas durante redirecionamentos
    const t = setTimeout(() => {
      window.parent.postMessage(
        { type: "vendy_nav", path: location.pathname },
        "*"
      );
    }, 100);
    return () => clearTimeout(t);
  }, [location.pathname, inIframe]);

  // Recebe comandos de navegação vindos do frame pai
  useEffect(() => {
    if (!inIframe) return;
    const handler = (e: MessageEvent) => {
      if (
        e.data?.type === "vendy_navigate" &&
        typeof e.data.path === "string" &&
        e.data.path !== location.pathname
      ) {
        navigate(e.data.path, { replace: true });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigate, location.pathname, inIframe]);

  return null;
};
