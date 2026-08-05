# FaciliGym - Guia de Configuração e Exportação .IPA para AltStore PAL

O **FaciliGym** é um aplicativo mobile de academia minimalista de alta performance desenvolvido em **React Native (Expo SDK 52)**, conectado ao banco **NeonDB (Serverless PostgreSQL)**.

---

## 1. Estrutura do Projeto

```
FaciliGym/
├── backend/
│   ├── db/schema.sql       # Esquema Relacional de Banco de Dados (NeonDB)
│   └── src/index.ts        # API Hono RESTful
├── src/
│   ├── app/                # Expo Router com suporte a Navegação por Abas
│   │   ├── (tabs)/index.tsx    # Frequência & Calendário
│   │   ├── (tabs)/workouts.tsx # Fichas de Treinos (ABC) & Cronômetro
│   │   ├── (tabs)/diet.tsx     # Gestão Alimentar & Macronutrientes
│   │   └── (tabs)/settings.tsx # Configurações & AltStore Status
│   ├── components/         # Design System (Header, CalendarView, MacroBar)
│   ├── constants/Theme.ts  # Paleta de Cores e Estilos
│   └── services/api.ts     # Serviços com suporte Offline + NeonDB Sync
└── README_ALTSTORE.md
```

---

## 2. Como Configurar o NeonDB (Serverless PostgreSQL)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech).
2. Crie um projeto chamado `faciligym`.
3. Abra a aba **SQL Editor** do Neon Console.
4. Copie e cole o conteúdo de [`backend/db/schema.sql`](file:///d:/FaciliGym/backend/db/schema.sql) e clique em **Run**.
5. Copie a sua Connection String (`DATABASE_URL`).

---

## 3. Como Compilar o Arquivo `.ipa` para AltStore PAL / Sideloading

Como a AltStore PAL permite a instalação de apps iOS por fora da App Store tradicional:

### Opção A: EAS Build (Nuvem ou Local)
1. Instale o EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Faça login na sua conta Expo gratuita:
   ```bash
   eas login
   ```
3. Inicie a configuração do build iOS:
   ```bash
   eas build:configure
   ```
4. Gere o arquivo `.ipa`:
   ```bash
   eas build -p ios --profile preview
   ```
5. Baixe o arquivo `.ipa` gerado e envie para o iPhone através do **AltServer** ou **AltStore PAL**.

### Opção B: Build Local via Xcode (macOS)
1. Execute `npx expo run:ios --configuration Release` ou `npx expo prebuild`.
2. Abra a pasta `ios/FaciliGym.xcworkspace` no Xcode.
3. No Xcode, selecione **Product > Archive**.
4. Clique em **Distribute App** > **Ad-Hoc / Sideloading** e salve o arquivo `.ipa`.

---

## 4. Testando o App em Desenvolvimento (Web & Mobile)

Para testar o aplicativo no navegador ou simulador:
```bash
npx expo start
```
Ou no navegador:
```bash
npx expo start --web
```
