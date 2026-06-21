# 🏊 Ranking Natação - Esporte Clube Sírio

App de ranking gamificado para as turmas de Aperfeiçoamento 2 e 3, **com sincronização em tempo real** via Firebase — vários professores podem registrar aulas, e qualquer pessoa com o link vê o ranking atualizado na hora.

## 📂 O que tem aqui

Este é um projeto React completo, conectado ao Firestore (banco de dados do Firebase), pronto para publicar gratuitamente na internet.

## 🔥 Passo 1 — Ajustar a regra de segurança do Firestore

Antes de publicar, ajuste a regra de acesso no Firebase para que o app consiga ler e escrever os dados:

1. Acesse **https://console.firebase.google.com**, abra o projeto `natacao-f54cb`
2. No menu lateral: **Compilação → Firestore Database → Regras** (aba "Rules")
3. Substitua o conteúdo por:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ranking-natacao/{document} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Clique em **Publicar**

> ⚠️ Essa regra permite que qualquer pessoa com o link do app leia e edite os dados
> (não há login de usuário no app). Isso é proposital para manter o app simples,
> mas significa que a senha do professor (`sirio123`) é a única proteção da área
> de edição. Não compartilhe essa senha publicamente.

## 🚀 Passo 2 — Publicar o app (escolha uma opção)

### Opção A — Vercel (recomendado, mais simples)

1. Acesse **https://vercel.com** e crie uma conta gratuita
2. Clique em **"Add New Project"**
3. Arraste a pasta inteira deste projeto (`ranking-natacao-app`)
4. A Vercel detecta automaticamente que é um projeto Vite/React
5. Clique em **Deploy**
6. Em ~1 minuto você recebe um link tipo `https://ranking-natacao-sirio.vercel.app`
7. Esse link funciona no PC, celular e tablet — é só abrir no navegador!

### Opção B — Netlify

1. No terminal, dentro desta pasta, rode:
   ```
   npm install
   npm run build
   ```
2. Isso cria uma pasta **`dist`**
3. Acesse **https://app.netlify.com/drop** e arraste a pasta **`dist`**
4. Você recebe um link público na hora

> 💡 Dica: depois você pode personalizar o link nas configurações do site
> (ex: trocar para `ranking-natacao-sirio.netlify.app`).

## 💻 Como rodar no seu computador antes de publicar (opcional)

1. Instale o **Node.js** (https://nodejs.org) se ainda não tiver
2. No terminal, dentro desta pasta:
   ```
   npm install
   npm run dev
   ```
3. Abra o link que aparecer (geralmente `http://localhost:5173`)

## 🔑 Senha do professor

A senha padrão para acessar o painel de professor é:

```
sirio123
```

Para trocar, edite `src/App.jsx` e procure por `const SENHA = "sirio123";`

## 🔄 Como funciona a sincronização agora

- Os dados (alunos, aulas, pontos) ficam salvos no **Firestore**, na nuvem
- Qualquer professor que entrar com a senha e registrar uma aula atualiza
  os dados **na hora** para todo mundo que tiver o app aberto — celular, PC, tablet
- Os alunos não precisam de senha para ver o ranking, só abrir o link
- Não existe mais a limitação de "cada aparelho com seus próprios dados"

## 📱 Usando no celular/tablet depois de publicado

Depois de publicar, basta abrir o link gerado no navegador do celular ou tablet.
Pode "adicionar à tela inicial" pelo navegador para parecer um aplicativo de verdade.

