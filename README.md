# AXIS

**Plataforma de gestão e utilização de estações de recarga para veículos elétricos.**

O **AXIS** é uma plataforma desenvolvida para o **GoodWe Challenge 2026**, com o objetivo de facilitar a gestão, utilização e expansão da infraestrutura de recarga para veículos elétricos.

A solução conecta usuários, comerciantes, administradores e estações de recarga em uma única plataforma, permitindo acompanhar a disponibilidade dos carregadores, sessões de recarga, consumo de energia e informações relacionadas à infraestrutura.

Além de facilitar a utilização dos carregadores pelos usuários, o AXIS busca **facilitar a instalação e o gerenciamento de novas estações de recarga**, permitindo que diferentes ambientes possam integrar sua infraestrutura à plataforma.

## Objetivos

* Facilitar o acesso a estações de recarga para veículos elétricos;
* Facilitar a instalação e o gerenciamento de novas estações de recarga;
* Centralizar informações sobre carregadores e estações;
* Permitir o acompanhamento de sessões de recarga;
* Monitorar consumo e potência durante as recargas;
* Auxiliar no gerenciamento da demanda energética;
* Permitir que comerciantes acompanhem a utilização e o desempenho de seus carregadores;
* Oferecer suporte à utilização de carregadores em condomínios;
* Permitir que administradores acompanhem a infraestrutura de recarga de seus condomínios.

## Como funciona

O AXIS organiza a infraestrutura de recarga em diferentes níveis.

### Estação de recarga

A **estação de recarga** representa o local ou estrutura onde os carregadores estão instalados.

Uma estação pode possuir **um ou mais carregadores**.

Exemplo:

```text
Estação de Recarga — Shopping Paulista
│
├── Carregador 01 — Disponível
├── Carregador 02 — Em uso
├── Carregador 03 — Disponível
└── Carregador 04 — Indisponível
```

Dessa forma, uma estação pode centralizar vários carregadores instalados em um mesmo local.

### Carregador

Cada carregador pertence obrigatoriamente a uma estação de recarga.

O carregador possui informações próprias, como:

* Identificação.
* Status.
* Potência.
* Tipo de conector.
* Preço da recarga.
* Sessões realizadas.

O usuário pode consultar essas informações antes de iniciar uma recarga.

## Usuários

O AXIS considera diferentes perfis de utilização da plataforma.

### Usuário

O usuário pode utilizar a plataforma para encontrar e utilizar estações de recarga.

Entre suas funcionalidades estão:

* Visualizar estações próximas.
* Visualizar carregadores disponíveis.
* Consultar informações da estação.
* Consultar preço da recarga.
* Visualizar estimativa de tempo de recarga.
* Iniciar uma sessão de recarga.
* Acompanhar uma sessão em andamento.
* Consultar seu histórico de recargas.

### Comerciante

O comerciante pode cadastrar e gerenciar a infraestrutura de recarga disponibilizada em seu estabelecimento.

Entre suas funcionalidades estão:

* Cadastrar estações de recarga.
* Cadastrar carregadores.
* Editar informações dos carregadores.
* Definir preços.
* Acompanhar o status dos carregadores.
* Acompanhar sessões de recarga.
* Visualizar consumo de energia.
* Acompanhar potência utilizada.
* Acompanhar receita gerada.
* Consultar relatórios de utilização.

## Gestão de condomínios

O AXIS também contempla a utilização de estações de recarga em **condomínios residenciais**.

Nesse cenário, o condomínio pode possuir uma ou mais estações de recarga, cada uma podendo possuir um ou mais carregadores.

```text
Condomínio
│
├── Estação de Recarga 01
│   ├── Carregador 01
│   └── Carregador 02
│
└── Estação de Recarga 02
    ├── Carregador 03
    └── Carregador 04
```

Os moradores vinculados ao condomínio podem utilizar os carregadores disponíveis, enquanto o administrador possui uma visão geral da infraestrutura.

### Morador

O morador vinculado a um condomínio poderá:

* Visualizar as estações do condomínio.
* Consultar os carregadores disponíveis.
* Iniciar sessões de recarga.
* Acompanhar uma recarga em andamento.
* Consultar seu histórico de utilização.

Além disso, o morador continua podendo utilizar as demais funcionalidades disponíveis para usuários da plataforma.

### Administrador do condomínio

O administrador possui acesso às informações da infraestrutura do condomínio.

Ele poderá:

* Acompanhar as estações de recarga.
* Visualizar os carregadores vinculados a cada estação.
* Acompanhar o status dos carregadores.
* Visualizar sessões em andamento.
* Consultar sessões concluídas.
* Acompanhar o consumo de energia.
* Consultar o histórico de utilização.
* Acompanhar a utilização dos carregadores pelos moradores.
* Gerenciar os usuários vinculados ao condomínio.

Dessa forma, o administrador consegue acompanhar a utilização da infraestrutura sem precisar interferir diretamente nas sessões individuais dos moradores.

## Sessões de recarga

Cada utilização de um carregador gera uma sessão de recarga.

Durante uma sessão, a plataforma pode acompanhar informações como:

* Usuário.
* Estação de recarga.
* Carregador utilizado.
* Energia acumulada.
* Potência utilizada.
* Tempo de recarga.
* Tempo restante estimado.
* Custo da sessão.
* Data e horário.
* Status da sessão.

A sessão pode ser acompanhada em tempo real, permitindo que o usuário visualize a evolução da recarga.

## Monitoramento energético

O AXIS também possui foco no acompanhamento do consumo e da demanda energética.

A plataforma permite visualizar informações relacionadas a:

* Potência utilizada.
* Energia consumida.
* Capacidade disponível.
* Demanda dos carregadores.
* Consumo por sessão.
* Consumo por carregador.
* Consumo por estação.

Esses dados podem auxiliar na identificação de períodos de maior demanda e no gerenciamento da infraestrutura.

## Relatórios

Para comerciantes e administradores, a plataforma pode apresentar informações consolidadas sobre a utilização da infraestrutura.

Entre os dados que podem ser analisados estão:

* Utilização por período.
* Consumo de energia.
* Sessões realizadas.
* Desempenho dos carregadores.
* Receita gerada.
* Utilização individual das estações.

Os dados podem ser utilizados para acompanhar o funcionamento da infraestrutura e auxiliar na tomada de decisões relacionadas à expansão ou gerenciamento das estações.

## Arquitetura da solução

O projeto foi desenvolvido como uma aplicação web utilizando **TypeScript**.

A arquitetura utiliza uma separação entre interface, lógica da aplicação e serviços responsáveis pela persistência e gerenciamento dos dados.

### Tecnologias

* **TypeScript**
* **React**
* **Vite**
* **Supabase**
* **Tailwind CSS**
* **shadcn/ui**
* **Git**
* **GitHub**

## Estrutura do projeto

```text
Axis_goodwe_challenge/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   └── ...
│
├── supabase/
│
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

A estrutura foi organizada para separar componentes, páginas, funcionalidades da aplicação e recursos relacionados ao banco de dados.

## Banco de dados

O projeto utiliza o **Supabase** como plataforma de backend e persistência de dados.

A estrutura de dados considera entidades relacionadas à infraestrutura de recarga, usuários e sessões.

Entre os principais relacionamentos estão:

```text
Condomínio
    │
    ├── Usuários
    │
    └── Estações
           │
           └── Carregadores
                  │
                  └── Sessões de recarga
```

A relação entre estação e carregador é fundamental para o funcionamento da plataforma:

**Uma estação possui um ou mais carregadores, enquanto cada carregador pertence a uma única estação.**

Isso permite representar diferentes cenários de infraestrutura sem limitar uma estação a apenas um equipamento.

## Instalação e execução

Clone o repositório:

```bash
git clone https://github.com/Gustavo-Mendonca-dev/Axis_goodwe_challenge.git
```

Entre no diretório:

```bash
cd Axis_goodwe_challenge
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

A aplicação estará disponível no endereço local indicado pelo Vite.

## Desenvolvimento

O AXIS foi desenvolvido de forma modular, permitindo a expansão da plataforma conforme novas necessidades sejam identificadas.

Entre as possibilidades de evolução estão:

* Expansão do gerenciamento de condomínios.
* Sistema de reservas de carregadores.
* Controle de acesso por usuário.
* Relatórios mais detalhados.
* Expansão da gestão energética.
* Integração com diferentes modelos de carregadores.
* Expansão da quantidade de estações gerenciadas.
* Integração com sistemas de pagamento.
* Recursos avançados para administradores e comerciantes.

## GoodWe Challenge 2026

O AXIS foi desenvolvido como solução para o **GoodWe Challenge 2026**, propondo uma plataforma voltada à gestão e utilização de infraestrutura de recarga para veículos elétricos.

A proposta busca integrar diferentes participantes desse ecossistema em uma única solução, desde o usuário que precisa recarregar seu veículo até o responsável pela instalação e gerenciamento das estações.

## Equipe

**Grupo 4 — FIAP**

* Ângelo Malta Reina - RM 570769
* Gustavo Mendonça Duarte - RM 570561
* Matheus Carpinheiro Moreno - RM 571770
* Renan de Castro Albuquerque - RM 570532
* Vinícius Souza Ferraz - RM 570622

---

**AXIS — Conectando infraestrutura, pessoas e energia.**
