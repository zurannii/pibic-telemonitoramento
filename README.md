# Telemonitoramento Clinico - PIBIC

Sistema web para acompanhamento remoto de pacientes, organizacao da equipe clinica, criacao de perguntas, agendamento de rotinas e comunicacao por Telegram e WhatsApp.

O projeto usa Next.js com App Router, React e TypeScript. No estado atual, os dados ainda sao armazenados em JSON. O Prisma esta instalado e preparado para uma futura migracao para PostgreSQL, mas ainda nao substitui o arquivo JSON.

## Funcionalidades

- autenticacao por sessao;
- cadastro e acompanhamento de pacientes;
- perfis de administrador, profissional e visualizador;
- perguntas e rotinas de telemonitoramento;
- alertas clinicos e historico de mensagens;
- envio e recebimento de mensagens pelo Telegram;
- envio e recebimento de mensagens pelo WhatsApp Cloud API;
- painel responsivo para desktop e dispositivos moveis.

## Tecnologias

- Next.js (App Router);
- React;
- TypeScript;
- CSS Modules;
- Node.js runtime nas rotas de API;
- Prisma e PostgreSQL preparados para migracao futura;
- Telegram Bot API;
- WhatsApp Cloud API da Meta.

## Requisitos

- Node.js 20 ou superior;
- npm;
- Git;
- uma URL HTTPS publica para receber webhooks em producao;
- conta no Vercel, caso o deploy seja feito nessa plataforma;
- bot do Telegram e/ou aplicativo da Meta, caso as integracoes sejam utilizadas.

Confira as versoes instaladas:

```bash
node --version
npm --version
git --version
```

## Instalacao local

Clone o repositorio e entre na pasta do projeto:

```bash
git clone URL_DO_REPOSITORIO
cd "front - pibic"
```

Instale exatamente as dependencias registradas no `package-lock.json`:

```bash
npm ci
```

No PowerShell, crie o arquivo local de ambiente:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux, use:

```bash
cp .env.example .env
```

Gere um segredo de sessao:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o valor gerado para `SESSION_SECRET` no arquivo `.env`. Em seguida, inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

## Credenciais de demonstracao

Quando o banco JSON precisa ser criado a partir do seed, estas contas sao disponibilizadas apenas para desenvolvimento:

| Perfil | Email | Senha |
| --- | --- | --- |
| Administrador | `demo@telemonitor.com` | `demo123` |
| Profissional | `fisio@telemonitor.com` | `demo123` |

Troque ou remova essas credenciais antes de utilizar o sistema com dados reais.

## Variaveis de ambiente

| Variavel | Obrigatoria | Finalidade |
| --- | --- | --- |
| `SESSION_SECRET` | Sim em producao | Assina o cookie da sessao. |
| `TELEGRAM_ENABLED` | Nao | Ativa o Telegram por configuracao de ambiente. |
| `TELEGRAM_BOT_TOKEN` | Para Telegram | Token entregue pelo `@BotFather`. |
| `TELEGRAM_BOT_USERNAME` | Para links Telegram | Username do bot, sem necessidade do `@`. |
| `TELEGRAM_WEBHOOK_SECRET` | Recomendado | Valida as requisicoes recebidas do Telegram. |
| `DATABASE_URL` | Somente apos a migracao | Conexao PostgreSQL usada pelo Prisma. |

Os dados do WhatsApp ainda sao configurados pela tela **Equipe** e armazenados no banco JSON. Por isso, no Vercel eles continuam sujeitos a perda enquanto a migracao para PostgreSQL nao for concluida.

Nunca envie `.env`, tokens, senhas ou segredos para o repositorio. O Git ignora esses arquivos e mantem apenas o `.env.example` como modelo.

## Comandos do projeto

Iniciar em desenvolvimento:

```bash
npm run dev
```

Validar a compilacao de producao:

```bash
npm run build
```

Executar localmente a compilacao de producao:

```bash
npm run start
```

O projeto ainda nao possui scripts de lint ou testes automatizados no `package.json`.

## Armazenamento atual

O acesso aos dados esta centralizado em `lib/server/db.ts`.

- localmente, a aplicacao le e grava `data/app-db.json`;
- no Vercel, a aplicacao copia o JSON inicial para `/tmp/app-db.json`;
- `/tmp` permite escrita e evita o erro 500 causado pelo sistema de arquivos somente leitura;
- `/tmp` e temporario: reinicios, novas instancias e cold starts podem descartar os dados;
- duas instancias Serverless podem manter copias diferentes do arquivo.

Portanto, o uso de `/tmp` e apenas uma compatibilidade temporaria. Nao use essa persistencia para dados clinicos reais.

## Telegram

### 1. Criar o bot

No Telegram, converse com `@BotFather`, execute `/newbot` e guarde:

- Bot Token;
- Bot Username.

### 2. Gerar a Webhook Secret

A Webhook Secret e criada pela equipe do projeto, nao pelo Telegram:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configurar

Existem duas formas de configuracao:

1. preencher Bot Token, Bot Username e Webhook Secret na tela **Equipe > Integracao com Telegram**; ou
2. preencher as variaveis `TELEGRAM_*` no ambiente do servidor.

Ao salvar a integracao pela interface, o backend registra automaticamente esta URL:

```text
https://SEU_DOMINIO/api/telegram/webhook
```

O Telegram envia a Webhook Secret no cabecalho `X-Telegram-Bot-Api-Secret-Token`, que e validado pelo sistema.

### 4. Vincular um paciente

Cada paciente recebe um token com prefixo `tglink_`. A pagina do paciente monta um link no formato:

```text
https://t.me/SEU_BOT?start=TOKEN_DE_VINCULO
```

Quando o paciente inicia o bot por esse link, o webhook associa o `chatId` do Telegram ao cadastro.

O token de vinculo atual nao expira nem e invalidado depois do uso. Ele deve ser tratado como informacao sensivel ate que o fluxo seja convertido para token de uso unico.

## WhatsApp Cloud API

Na tela **Equipe > Integracao com WhatsApp**, informe:

- Access Token;
- Phone Number ID;
- Business Account ID;
- Verify Token criado pela equipe;
- App Secret do aplicativo Meta;
- versao ativa da Graph API.

Na configuracao de Webhooks da Meta, use:

```text
Callback URL: https://SEU_DOMINIO/api/whatsapp/webhook
Verify Token: o mesmo valor preenchido no sistema
```

O `GET` do webhook responde ao desafio de verificacao da Meta. O `POST` valida `X-Hub-Signature-256` quando existe um App Secret e registra mensagens de pacientes identificados pelo telefone.

Confirme na documentacao da Meta se a versao da Graph API configurada ainda esta ativa antes do deploy.

## Deploy no Vercel

Primeiro, valide o build local:

```bash
npm ci
npm run build
```

Instale e autentique a CLI do Vercel, caso ainda nao esteja disponivel:

```bash
npm install --global vercel
vercel login
```

Vincule o projeto:

```bash
vercel
```

Adicione os segredos de producao. Os comandos pedem o valor de forma interativa:

```bash
vercel env add SESSION_SECRET production
vercel env add TELEGRAM_ENABLED production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_BOT_USERNAME production
vercel env add TELEGRAM_WEBHOOK_SECRET production
```

Publique em producao:

```bash
vercel --prod
```

Depois do deploy, salve novamente as configuracoes do Telegram para registrar o dominio de producao. Configure a URL de producao do WhatsApp no painel da Meta.

## Prisma e migracao para PostgreSQL

O repositorio ja possui Prisma, `prisma.config.ts` e `prisma/schema.prisma`. Entretanto, o schema ainda nao contem os modelos do sistema e `lib/server/db.ts` continua sendo a fonte de dados.

Antes de executar a primeira migracao, modele no Prisma pelo menos:

- User;
- Patient;
- Question;
- Schedule;
- Message;
- Alert;
- WhatsAppSettings;
- TelegramSettings;
- Session, caso as sessoes tambem sejam persistidas.

Depois de criar os modelos e configurar `DATABASE_URL`, valide e formate o schema:

```bash
npx prisma format
npx prisma validate
```

Crie a migracao local:

```bash
npx prisma migrate dev --name initial_schema
npx prisma generate
```

Inspecione o banco durante o desenvolvimento:

```bash
npx prisma studio
```

No ambiente de producao, aplique apenas migracoes ja versionadas:

```bash
npx prisma migrate deploy
```

Nao execute `prisma migrate dev` em producao. Tambem nao execute a migracao inicial antes de implementar os modelos, o cliente Prisma e o script de importacao de `data/app-db.json`.

Fluxo recomendado para concluir a migracao:

1. modelar as entidades em `prisma/schema.prisma`;
2. criar e revisar a migracao;
3. implementar uma camada de repositorios usando Prisma;
4. criar um script idempotente para importar o JSON;
5. testar a importacao em um banco de homologacao;
6. trocar as rotas para os repositorios;
7. aplicar `npx prisma migrate deploy` no Vercel;
8. remover a dependencia de escrita em `/tmp`.

## Agendamentos

O scheduler em memoria funciona somente no ambiente local de desenvolvimento. Ele fica desativado no Vercel porque processos Serverless nao permanecem ativos de forma continua.

Para producao, crie uma rota protegida de processamento e acione-a com Vercel Cron ou outro worker. A rota deve usar autenticacao propria, idempotencia e o banco PostgreSQL para evitar disparos duplicados.

## Rotas principais da API

| Rota | Metodos | Funcao |
| --- | --- | --- |
| `/api/auth/register` | `POST` | Cadastro e inicio de sessao. |
| `/api/auth/login` | `POST` | Login. |
| `/api/auth/logout` | `POST` | Encerramento da sessao. |
| `/api/auth/session` | `GET` | Consulta da sessao atual. |
| `/api/bootstrap` | `GET` | Dados iniciais do dashboard. |
| `/api/patients` | `GET`, `POST` | Listagem e cadastro de pacientes. |
| `/api/patients/[patientId]` | `GET`, `PATCH`, `DELETE` | Detalhes, edicao e exclusao. |
| `/api/patients/[patientId]/schedules` | `POST`, `PATCH`, `DELETE` | Rotinas do paciente. |
| `/api/patients/[patientId]/send-test` | `POST` | Envio manual de teste. |
| `/api/questions` | `GET`, `POST` | Perguntas de monitoramento. |
| `/api/questions/[questionId]` | `PATCH`, `DELETE` | Edicao e exclusao de pergunta. |
| `/api/alerts/[alertId]` | `PATCH` | Atualizacao ou resolucao de alerta. |
| `/api/users` | `GET`, `POST` | Equipe profissional. |
| `/api/users/[userId]` | `PATCH`, `DELETE` | Edicao e exclusao de profissional. |
| `/api/telegram/settings` | `GET`, `PATCH` | Configuracao autenticada do Telegram. |
| `/api/telegram/webhook` | `GET`, `POST` | Recebimento de eventos do Telegram. |
| `/api/whatsapp/settings` | `GET`, `PATCH` | Configuracao autenticada do WhatsApp. |
| `/api/whatsapp/webhook` | `GET`, `POST` | Verificacao e eventos da Meta. |

As rotas de configuracao e de dados exigem sessao. Os webhooks usam os mecanismos de verificacao de cada provedor.

## Estrutura relevante

```text
app/
  api/                    Rotas HTTP do App Router
  home/components/        Componentes compartilhados do dashboard
  home/hooks/             Estado e operacoes da pagina principal
  home/screens/           Telas funcionais
  globals.css             Estilos globais
  page.module.css         Design system e estilos do dashboard
lib/
  server/                 Banco, autenticacao, mensagens e integracoes
  shared/                 Tipos compartilhados
data/
  app-db.json             Banco JSON local
prisma/
  schema.prisma           Schema PostgreSQL em preparacao
```

## Verificacao antes de publicar

```bash
npm ci
npm run build
git status
```

Confirme tambem:

- `SESSION_SECRET` forte e exclusivo em producao;
- nenhuma credencial real no Git;
- webhooks usando HTTPS;
- Webhook Secret do Telegram configurada;
- Verify Token e App Secret do WhatsApp configurados;
- credenciais de demonstracao removidas;
- banco PostgreSQL concluido antes de armazenar dados clinicos reais;
- politica de backup, controle de acesso, auditoria e adequacao a LGPD.

## Problemas comuns

### Erro 500 ao salvar no Vercel

O projeto usa `/tmp/app-db.json` no Vercel. Verifique os logs da funcao, mas lembre que `/tmp` nao oferece persistencia. A solucao definitiva e PostgreSQL.

### Telegram salva, mas o webhook nao registra

- confirme que o dominio e HTTPS e esta publicado;
- confira Bot Token e Bot Username;
- gere uma Webhook Secret com caracteres alfanumericos;
- salve novamente a integracao depois do deploy;
- verifique se `/api/telegram/webhook` esta acessivel.

### WhatsApp nao confirma o webhook

- use exatamente o mesmo Verify Token na Meta e no sistema;
- confira a Callback URL;
- confirme que o dominio esta em producao e usa HTTPS.

### Dados desaparecem no Vercel

Esse comportamento e esperado com `/tmp`. Conclua a migracao para PostgreSQL antes do uso real.
