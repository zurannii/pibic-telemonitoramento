# Telemonitoramento Clinico - PIBIC

Sistema web para acompanhamento remoto de pacientes, organizacao da equipe clinica, criacao de perguntas, agendamento de rotinas e comunicacao por Telegram e WhatsApp.

O projeto usa Next.js com App Router, React, TypeScript, Prisma e PostgreSQL. Quando `DATABASE_URL` esta configurada, todas as funcoes Serverless compartilham o mesmo banco. Sem essa variavel, o JSON permanece disponivel apenas como fallback de desenvolvimento.

## Funcionalidades

- autenticacao por sessao;
- cadastro e acompanhamento de pacientes;
- perfis de administrador, profissional e visualizador;
- perguntas e rotinas de telemonitoramento;
- alertas clinicos e historico de mensagens;
- envio e recebimento de mensagens pelo Telegram;
- envio e recebimento de mensagens pelo WhatsApp Cloud API;
- mensagens assistidas por voz natural para pacientes nao alfabetizados;
- painel responsivo para desktop e dispositivos moveis.

## Tecnologias

- Next.js (App Router);
- React;
- TypeScript;
- CSS Modules;
- Node.js runtime nas rotas de API;
- Prisma 7 com PostgreSQL/Supabase;
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
| `APP_URL` | Opcional | Dominio canonico usado para registrar webhooks. |
| `TELEGRAM_ENABLED` | Nao | Ativa o Telegram por configuracao de ambiente. |
| `TELEGRAM_BOT_TOKEN` | Para Telegram | Token entregue pelo `@BotFather`. |
| `TELEGRAM_BOT_USERNAME` | Para links Telegram | Username do bot, sem necessidade do `@`. |
| `TELEGRAM_WEBHOOK_SECRET` | Recomendado | Valida as requisicoes recebidas do Telegram. |
| `GROQ_API_KEY` | Para transcricao | Chave usada exclusivamente no servidor para transcrever audios. |
| `GROQ_TRANSCRIPTION_TIMEOUT_MS` | Nao | Timeout da transcricao em milissegundos (padrao: `60000`). |
| `ELEVENLABS_API_KEY` | Para mensagens em audio | Chave usada exclusivamente no servidor para gerar a voz das mensagens. |
| `ELEVENLABS_TTS_MODEL` | Nao | Modelo de voz (padrao: `eleven_flash_v2_5`). |
| `ELEVENLABS_VOICE_ID` | Nao | Identificador da voz do ElevenLabs. |
| `ELEVENLABS_TTS_TIMEOUT_MS` | Nao | Timeout da geracao de voz em milissegundos (padrao: `60000`). |
| `DATABASE_URL` | Sim em producao | Transaction Pooler do Supabase usado pela aplicacao. |
| `DIRECT_URL` | Para migrations locais | Conexao direta ou Session Pooler usada pelo Prisma CLI. |

As configuracoes do WhatsApp e Telegram tambem sao persistidas no PostgreSQL. Em producao, as variaveis `TELEGRAM_*` possuem prioridade sobre valores antigos armazenados no banco.

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

- com `DATABASE_URL`, a aplicacao usa as tabelas PostgreSQL por meio do Prisma;
- as escritas sao executadas em transacoes com lock para evitar atualizacoes concorrentes;
- localmente, sem `DATABASE_URL`, a aplicacao usa `data/app-db.json`;
- no Vercel, o fallback ainda usa `/tmp/app-db.json`, mas nao deve ser usado apos ativar o PostgreSQL.

Nunca publique em producao sem `DATABASE_URL`. O fallback `/tmp` existe apenas para impedir uma quebra durante a transicao.

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

### 5. Transcricao de audio

Defina `GROQ_API_KEY` no ambiente do servidor para aceitar mensagens de voz e arquivos de audio. O webhook baixa o arquivo pela Bot API, mantem o indicador de digitacao ativo durante o processamento e envia o conteudo para o modelo `whisper-large-v3`. O texto resultante percorre o mesmo fluxo de persistencia, associacao de respostas e geracao de alertas usado por mensagens de texto.

Os formatos aceitos pela Groq (`flac`, `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `ogg`, `wav` e `webm`) sao enviados sem conversao. Isso inclui o OGG usado nas mensagens de voz do Telegram. Arquivos sao processados em memoria, sem temporarios em disco, e respeitam o limite de download de 20 MB da Bot API.

A resposta da Groq usa `verbose_json` para validar `no_speech_prob` e `avg_logprob` antes do registro. Audios com silencio, baixa confianca ou frases tipicas de alucinacao de legendas sao descartados e seguem o mesmo tratamento amigavel de audio incompreensivel.

Depois de uma transcricao bem-sucedida, o paciente recebe uma confirmacao de que o relato foi registrado e encaminhado para a equipe. O painel consulta novos dados automaticamente a cada cinco segundos e restaura a ultima tela e o perfil selecionado depois de recarregar a pagina.

Toda nova mensagem recebida de um paciente pelo Telegram ou WhatsApp gera uma confirmacao automatica de recebimento. Reentregas duplicadas dos webhooks nao geram novas confirmacoes. Para pacientes com audio assistido, a confirmacao tambem e enviada em audio.

### 6. Mensagens assistidas por audio

Ao cadastrar um paciente, selecione **Nao alfabetizado — enviar mensagens em audio** em **Acessibilidade de leitura**. Todas as mensagens enviadas pelo fluxo central — perguntas manuais, rotinas e confirmacoes do Telegram — passam a ser sintetizadas antes do envio. O Telegram recebe uma mensagem de voz e o WhatsApp recebe um arquivo de audio pela Cloud API; o texto original continua registrado no historico para a equipe.

Na aba **Respostas**, o campo **Formato do envio** permite manter o comportamento automatico do paciente ou escolher explicitamente **Mensagem de texto** e **Mensagem de audio**. Falhas dos provedores sao apresentadas na tela e continuam registradas no historico e nos alertas de entrega.

Configure `ELEVENLABS_API_KEY` somente no servidor. Por padrao, o projeto usa o modelo multilingue `eleven_flash_v2_5`, idioma portugues e saida MP3. Modelo e voz podem ser ajustados pelas variaveis `ELEVENLABS_TTS_MODEL` e `ELEVENLABS_VOICE_ID` sem alterar o codigo. Se a geracao ou o envio falhar, o sistema nao substitui silenciosamente o audio por texto: ele registra a falha e cria o alerta de entrega existente.

O plano gratuito do ElevenLabs deve ser usado somente com dados ficticios de demonstracao. Ele possui limite mensal, nao inclui licenca comercial e nao oferece as mesmas garantias de retencao de dados dos planos empresariais.

A tela **Relatorios** permite selecionar um paciente, consolidar todas as respostas clinicamente relevantes, visualizar intensidade e evolucao da dor, temas recorrentes, alertas e uma linha do tempo completa. O relatorio pode ser exportado diretamente em PDF e sempre inclui o aviso de revisao por profissional de saude.

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
vercel env add GROQ_API_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add DATABASE_URL production
```

Publique em producao:

```bash
vercel --prod
```

Depois do deploy, salve novamente as configuracoes do Telegram para registrar o dominio de producao. Configure a URL de producao do WhatsApp no painel da Meta.

## Ativacao do Supabase/PostgreSQL

O schema normalizado e a migration inicial ja estao versionados. As tabelas incluem usuarios, pacientes, perguntas, rotinas, mensagens, alertas e configuracoes dos provedores.

### 1. Criar o banco

Crie um projeto no Supabase e, na area de conexao do banco, copie:

- a URL do **Transaction Pooler** para `DATABASE_URL`;
- a URL de conexao direta ou **Session Pooler** para `DIRECT_URL`.

Guarde essas URLs apenas no `.env` local e nas variaveis protegidas do Vercel. Nao envie as URLs em mensagens ou commits.

### 2. Configurar o ambiente local

```env
DATABASE_URL="URL_DO_TRANSACTION_POOLER"
DIRECT_URL="URL_DIRETA_OU_SESSION_POOLER"
```

### 3. Validar e aplicar a migration

```bash
npm run db:generate
npm run db:validate
npm run db:migrate:deploy
```

### 4. Importar o JSON existente

Execute somente uma vez em um banco novo. O comando sincroniza o conteudo de `data/app-db.json` com o PostgreSQL:

```bash
npm run db:import-json -- --confirm
```

Depois da importacao, confira os dados:

```bash
npm run db:check
npm run db:studio
```

### 5. Ativar no Vercel

Adicione apenas a URL de runtime ao ambiente Production:

```bash
vercel env add DATABASE_URL production
vercel --prod
```

`DIRECT_URL` nao e necessaria para a aplicacao em execucao. Ela deve ficar no ambiente seguro usado para aplicar migrations.

Depois do deploy, salve novamente a integracao Telegram para registrar o webhook no dominio de producao e crie novamente qualquer paciente que tenha existido apenas no `/tmp` do Vercel.

Para futuras alteracoes no schema, use `npm run db:migrate -- --name nome_da_migration` em desenvolvimento e `npm run db:migrate:deploy` na publicacao.

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
| `/api/health` | `GET` | Verifica se o PostgreSQL esta ativo, sem expor segredos. |
| `/api/patients` | `GET`, `POST` | Listagem e cadastro de pacientes. |
| `/api/patients/[patientId]` | `GET`, `PATCH`, `DELETE` | Detalhes, edicao e exclusao. |
| `/api/patients/[patientId]/schedules` | `POST`, `PATCH`, `DELETE` | Rotinas do paciente. |
| `/api/patients/[patientId]/messages` | `POST` | Envio de pergunta ou mensagem personalizada. |
| `/api/questions` | `GET`, `POST` | Perguntas de monitoramento. |
| `/api/questions/[questionId]` | `PATCH`, `DELETE` | Edicao e exclusao de pergunta. |
| `/api/reports/patients/[patientId]` | `GET` | Resumo e analise descritiva das respostas do paciente. |
| `/api/alerts/[alertId]` | `PATCH` | Atualizacao ou resolucao de alerta. |
| `/api/users` | `GET`, `POST` | Equipe profissional. |
| `/api/users/[userId]` | `PATCH`, `DELETE` | Edicao e exclusao de profissional. |
| `/api/telegram/settings` | `GET`, `PATCH` | Configuracao autenticada do Telegram. |
| `/api/telegram/status` | `GET` | Diagnostico seguro do webhook registrado. |
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
  schema.prisma           Schema PostgreSQL normalizado
  migrations/             Migrations versionadas
scripts/
  import-json-to-postgres.ts  Importacao unica do JSON
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
- `DATABASE_URL` apontando para o banco PostgreSQL de producao;
- `GROQ_API_KEY` para compreender audios recebidos e `ELEVENLABS_API_KEY` para responder em voz;
- politica de backup, controle de acesso, auditoria e adequacao a LGPD.

## Problemas comuns

### Erro 500 ao salvar no Vercel

Confirme que `DATABASE_URL` esta configurada em Production e que `npm run db:migrate:deploy` foi executado. Sem essa variavel, o fallback usa `/tmp` e nao oferece persistencia.

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

Esse comportamento indica que `DATABASE_URL` nao esta ativa no deploy atual. Configure a variavel em Production e faca um novo deploy.

### Confirmar a conexao PostgreSQL

Abra `https://SEU_DOMINIO/api/health`. A resposta correta em producao e:

```json
{"ok":true,"database":"postgresql"}
```
