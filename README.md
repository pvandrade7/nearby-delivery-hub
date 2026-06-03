# 🛍️ Vendy+

**Vendy+** é uma plataforma de marketplace hyperlocal desenvolvida para conectar clientes, lojistas, vendedores independentes e entregadores em um único ecossistema digital.

O sistema permite que lojas locais divulguem seus produtos, realizem vendas online e utilizem diferentes modalidades de entrega, proporcionando uma experiência moderna e acessível para o comércio regional.

---

## 🚀 Visão Geral

O Vendy+ foi criado com o objetivo de fortalecer o comércio local, oferecendo uma plataforma completa para:

* Compra e venda de produtos.
* Delivery local.
* Retirada em loja.
* Entrega por motoboy.
* Vendas entre usuários.
* Gestão de lojas.
* Rastreamento de pedidos.
* Comunicação entre clientes e vendedores.

---

## 🎯 Principais Funcionalidades

### 👤 Clientes

* Cadastro e autenticação.
* Busca de lojas e produtos.
* Favoritar lojas.
* Carrinho de compras.
* Checkout completo.
* Rastreamento de pedidos.
* Avaliação de compras.
* Chat com lojistas.

---

### 🏪 Lojistas

* Cadastro de loja.
* Gestão de produtos.
* Gestão de pedidos.
* Dashboard com métricas.
* Relatórios de vendas.
* Personalização da loja.
* Sistema de verificação.
* Gestão de avaliações.

---

### 🚚 Entregadores

* Visualização de entregas disponíveis.
* Aceitação de corridas.
* Atualização de status.
* Histórico de entregas.

---

### 🛡️ Administradores

* Gestão de usuários.
* Aprovação de lojas.
* Verificação manual de lojistas.
* Moderação da plataforma.
* Gerenciamento geral do sistema.

---

## ⭐ Diferenciais do Projeto

### Sistema de Verificação

Lojistas podem ser verificados de duas formas:

#### Verificação por CNPJ

Empresas formalizadas recebem validação automática.

#### Verificação Manual

Para vendedores sem CNPJ:

* Envio de documentos.
* Envio de fotos da loja.
* Redes sociais.
* Análise administrativa.
* Aprovação ou reprovação.

Após aprovação, a loja recebe o selo:

✅ Loja Verificada

---

### Sistema de Avaliações

* Avaliação de 1 a 5 estrelas.
* Comentários dos clientes.
* Média de avaliações.
* Histórico público de avaliações.

---

### Chat Integrado

Comunicação direta entre:

* Cliente ↔ Lojista

Com mensagens em tempo real.

---

### Rastreamento de Pedidos

Acompanhamento completo do pedido:

* Confirmado
* Preparando
* Saiu para entrega
* Entregue

### Recursos Disponíveis

* Dashboard preenchido.
* Produtos simulados.
* Pedidos simulados.
* Clientes fictícios.
* Avaliações.
* Relatórios.
* Métricas de desempenho.

O ambiente Demo utiliza apenas dados fictícios e não interfere nos dados reais da plataforma.

---

## 🛠️ Tecnologias Utilizadas

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

### Gerenciamento de Estado

* TanStack React Query
* React Context API
* React Hook Form
* Zod

### Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Realtime
* Supabase Storage

### Visualização de Dados

* Recharts

---

## 📂 Estrutura do Projeto

```text
src/
├── components/
├── context/
├── hooks/
├── pages/
│   ├── client/
│   ├── seller/
│   ├── courier/
│   └── admin/
├── integrations/
│   └── supabase/
├── data/
└── utils/
```

---

## 📱 Responsividade

O Vendy+ foi desenvolvido seguindo o conceito Mobile First, oferecendo suporte para:

* Smartphones
* Tablets
* Notebooks
* Desktops

---

## 🔒 Segurança

* Supabase Authentication
* Row Level Security (RLS)
* Controle de acesso por perfil
* Rotas protegidas
* Validação de formulários com Zod

---

## ⚙️ Instalação

### Clonar repositório

```bash
git clone https://github.com/seu-usuario/vendy-plus.git
```

### Instalar dependências

```bash
npm install
```

### Configurar ambiente

```env
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```

### Executar projeto

```bash
npm run dev
```

---

## 👨‍💻 Desenvolvido por

**Davi Rodrigues Monteiro Sampaio**

Análise e Desenvolvimento de Sistemas (ADS)
Universidade de Fortaleza — UNIFOR

---

### 💡 Slogan

**Vendy+ — Conectando clientes, lojas e entregadores em uma única plataforma.**
