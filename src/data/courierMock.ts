// Dados de demonstração para o módulo de entregadores.
// Não representam pedidos reais — usados apenas nas telas de curso do entregador.

export type DeliveryProposal = {
  id:                   string;
  orderId:              string;
  storeName:            string;
  category:             string;
  pickup:               string;
  pickupNeighborhood:   string;
  dropoff:              string;
  dropoffNeighborhood:  string;
  distanceKm:           number;
  routeKm:              number;
  distance:             string;
  earnings:             number;
  estimatedTime:        string;
  items:                number;
  priority?:            "alta";
};

export const deliveryProposals: DeliveryProposal[] = [
  { id:"d1",  orderId:"#1042", storeName:"Ferragem Fortaleza",      category:"🛠️", pickup:"Rua Senador Pompeu, 1120",      pickupNeighborhood:"Centro",       dropoff:"Av. Dom Luís, 500",             dropoffNeighborhood:"Aldeota",      distanceKm:1.2, routeKm:2.8,  distance:"2.8 km",  earnings:12.5, estimatedTime:"14 min", items:2, priority:"alta" },
  { id:"d2",  orderId:"#1043", storeName:"Farmácias Pague Menos",   category:"💊", pickup:"Av. Dom Luís, 500",             pickupNeighborhood:"Meireles",     dropoff:"Rua Tibúrcio Cavalcante, 234",  dropoffNeighborhood:"Meireles",    distanceKm:0.6, routeKm:1.1,  distance:"1.1 km",  earnings:7.0,  estimatedTime:"9 min",  items:1 },
  { id:"d3",  orderId:"#1044", storeName:"Magazine Luiza",           category:"💻", pickup:"Av. Santos Dumont, 6480",       pickupNeighborhood:"Aldeota",      dropoff:"Rua Carlos Vasconcelos, 890",   dropoffNeighborhood:"Aldeota",     distanceKm:1.8, routeKm:3.1,  distance:"3.1 km",  earnings:14.0, estimatedTime:"18 min", items:1 },
  { id:"d4",  orderId:"#1045", storeName:"O Boticário",              category:"💄", pickup:"Shopping Norte",                pickupNeighborhood:"Parangaba",    dropoff:"Av. Bezerra de Menezes, 1200",  dropoffNeighborhood:"São Gerardo", distanceKm:4.2, routeKm:6.5,  distance:"6.5 km",  earnings:22.0, estimatedTime:"32 min", items:3 },
  { id:"d5",  orderId:"#1046", storeName:"Cobasi",                   category:"🐾", pickup:"Av. Eng. Santana Júnior, 4500", pickupNeighborhood:"Varjota",      dropoff:"Rua Silva Jatahy, 120",         dropoffNeighborhood:"Meireles",    distanceKm:2.1, routeKm:3.8,  distance:"3.8 km",  earnings:16.0, estimatedTime:"22 min", items:2 },
  { id:"d6",  orderId:"#1047", storeName:"Leroy Merlin",             category:"🏗️", pickup:"Av. Washington Soares, 4335",  pickupNeighborhood:"Edson Queiroz",dropoff:"Rua Prof. Dias da Rocha, 720",  dropoffNeighborhood:"Aldeota",     distanceKm:5.5, routeKm:7.8,  distance:"7.8 km",  earnings:26.0, estimatedTime:"38 min", items:4, priority:"alta" },
  { id:"d7",  orderId:"#1048", storeName:"Cobasi",                   category:"🐾", pickup:"Av. Eng. Santana Júnior, 4500", pickupNeighborhood:"Varjota",      dropoff:"Av. Des. Moreira, 1400",        dropoffNeighborhood:"Aldeota",     distanceKm:2.8, routeKm:4.9,  distance:"4.9 km",  earnings:15.5, estimatedTime:"28 min", items:3, priority:"alta" },
  { id:"d8",  orderId:"#1049", storeName:"Casas Bahia",              category:"🛋️", pickup:"Shopping RioMar — Papicu",     pickupNeighborhood:"Papicu",       dropoff:"Rua Coronel Linhares, 300",     dropoffNeighborhood:"Fátima",      distanceKm:1.5, routeKm:2.9,  distance:"2.9 km",  earnings:14.0, estimatedTime:"17 min", items:1 },
  { id:"d9",  orderId:"#1050", storeName:"Renner",                   category:"👗", pickup:"Shopping Iguatemi — Água Fria", pickupNeighborhood:"Água Fria",    dropoff:"Rua Afonso Celso, 600",         dropoffNeighborhood:"Benfica",     distanceKm:6.3, routeKm:8.4,  distance:"8.4 km",  earnings:28.0, estimatedTime:"40 min", items:2 },
  { id:"d10", orderId:"#1051", storeName:"Havan",                    category:"🏠", pickup:"Rodovia CE-060 — Maracanaú",   pickupNeighborhood:"Maracanaú",    dropoff:"Av. Bezerra de Menezes, 1200",  dropoffNeighborhood:"São Gerardo", distanceKm:9.1, routeKm:11.5, distance:"11.5 km", earnings:38.0, estimatedTime:"55 min", items:5 },
  { id:"d11", orderId:"#1052", storeName:"Farmácias Pague Menos",   category:"💊", pickup:"Av. Dom Luís, 500 — Meireles",  pickupNeighborhood:"Meireles",     dropoff:"Rua Silva Jatahy, 900",         dropoffNeighborhood:"Meireles",    distanceKm:0.9, routeKm:1.6,  distance:"1.6 km",  earnings:7.0,  estimatedTime:"9 min",  items:2 },
  { id:"d12", orderId:"#1053", storeName:"Leroy Merlin",             category:"🏗️", pickup:"Av. Washington Soares, 4335",  pickupNeighborhood:"Edson Queiroz",dropoff:"Rua Coronel Jucá, 500",         dropoffNeighborhood:"Meireles",    distanceKm:7.8, routeKm:10.2, distance:"10.2 km", earnings:32.0, estimatedTime:"48 min", items:8 },
];
