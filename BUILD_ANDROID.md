# Publicar na Google Play Store

Este guia cobre o processo completo para publicar o PWA "Na Roda" como um
aplicativo Android nativo usando **Trusted Web Activity (TWA)**.

## Visão geral

O [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (ferramenta
oficial do Google) gera um wrapper Android que abre seu PWA em tela cheia,
sem barras do navegador. O resultado é um **Android App Bundle (AAB)** pronto
para upload na Play Store.

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| **JDK** | 17+ | Assinar o APK/AAB (`jarsigner`, `keytool`) |
| **Node.js** | 18+ | Rodar Bubblewrap CLI |
| **Android SDK** | API 33+ | `bundletool`, `apkanalyzer`, `android.jar` |
| **Google Play Console** | — | Conta de desenvolvedor (USD 25, taxa única) |

### NixOS (shell.nix incluso)

```bash
nix-shell
```

Fornece JDK 17 e Node.js 20. Android SDK precisa ser configurado separadamente
(veja abaixo).

### Android SDK

**Opção A — Android Studio (recomendado para NixOS)**

```bash
nix-shell -p android-studio
android-studio
```

Durante a instalação, marque "Android SDK", "Android SDK Platform 33" e
"Android SDK Build-Tools 33".

Depois de instalado, descubra o caminho do SDK:

```bash
# Geralmente ~/Android/Sdk
export ANDROID_HOME="$HOME/Android/Sdk"
```

**Opção B — Command-line tools manual**

```bash
# Baixar cmdline-tools
cd ~/Android
curl -o cmdline-tools.zip \
  https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip cmdline-tools.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null; true
mv cmdline-tools latest 2>/dev/null; true

# Instalar SDK
export ANDROID_HOME="$HOME/Android"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2" \
           "bundletool" "extras;google;google_play_services"
```

**Opção C — androidenv (Nix)**

Adicione ao `shell.nix` (experimental — pode exigir ajustes nas licenças):

```nix
let
  android = pkgs.androidenv.composeAndroidPackages {
    platformVersions = [ "33" ];
    buildToolsVersions = [ "33.0.2" ];
    extraLicenses = [
      "android-sdk-license-c81a61d9"
      "android-sdk-license-2742d1c5"
      "android-googletv-license-135afc36"
    ];
  };
in
pkgs.mkShell {
  buildInputs = [ nodejs_20 jdk17 android.androidsdk ];
  ANDROID_HOME = "${android.androidsdk}/libexec/android-sdk";
}
```

### Verificar ambiente

```bash
java -version
node --version
echo $ANDROID_HOME
ls "$ANDROID_HOME/platforms"  # deve listar android-33
```

---

## 2. Gerar chave de assinatura

```bash
keytool -genkey -v -keystore naroda.keystore -alias naroda \
  -keyalg RSA -keysize 2048 -validity 10000

# (opcional) converter para PKCS12 se o Bubblewrap pedir
keytool -importkeystore -srckeystore naroda.keystore \
  -destkeystore naroda.keystore -deststoretype pkcs12
```

⚠️ **Guarde esta chave em segurança.** Você precisará dela para toda
atualização futura do app. Sem ela, não é possível atualizar o app na Play
Store.

---

## 3. Inicializar projeto Android com Bubblewrap

```bash
# Instalar Bubblewrap globalmente
npm install -g @pwabuilder/bubblewrap

# Criar o projeto Android
bubblewrap init \
  --manifest https://pmarkun.github.io/naroda/manifest.json \
  --directory android \
  --package br.art.naroda.app \
  --host pmarkun.github.io
```

Isso gera a pasta `android/` com:
- `twa-manifest.json` — configuração do TWA
- `app/build.gradle` — build do app
- Código fonte Java da Trusted Web Activity

### Ajustes manuais no `twa-manifest.json`

Edite `android/twa-manifest.json`:

```json
{
  "packageId": "br.art.naroda.app",
  "host": "pmarkun.github.io",
  "name": "Na Roda",
  "launcherName": "Na Roda",
  "themeColor": "#000000",
  "backgroundColor": "#000000",
  "navigationColor": "#000000",
  "navigationBarColor": "#000000",
  "colorScheme": "dark",
  "startUrl": "/naroda/",
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "enableNotifications": true,
  "enableUrlBarHiding": true,
  "splashScreenFadeOutDuration": 300,
  "signing": {
    "file": "../naroda.keystore",
    "alias": "naroda"
  }
}
```

---

## 4. Build do AAB

```bash
cd android
bubblewrap build
```

O comando:
1. Gera os ícones adaptativos a partir do `icon-512.png` do PWA
2. Compila o app com Gradle
3. Assina com sua keystore
4. Alinha com `zipalign`
5. Gera o **App Bundle** em `android/app/build/outputs/bundle/release/app-release.aab`

Se o build falhar por SDK ausente, rode:

```bash
sdkmanager "build-tools;33.0.2" "platforms;android-33"
```

---

## 5. Testar localmente

```bash
# Instalar bundletool
npm install -g bundletool

# Gerar APK universal a partir do AAB
bundletool build-apks --bundle=app-release.aab \
  --output=app-release.apks \
  --ks=../naroda.keystore --ks-pass=pass:SENHA \
  --ks-key-alias=naroda --key-pass=pass:SENHA

# Instalar em dispositivo conectado
bundletool install-apks --apks=app-release.apks
```

---

## 6. Enviar para Google Play Console

1. Acesse [play.google.com/console](https://play.google.com/console)
2. Pague a taxa de USD 25 (se primeira vez)
3. Crie um novo app → **Android App Bundle**
4. Faça upload de `android/app/build/outputs/bundle/release/app-release.aab`
5. Preencha os campos obrigatórios:

| Campo | Conteúdo |
|---|---|
| **Título** | Na Roda |
| **Descrição curta** | Perguntas para conversas significativas |
| **Descrição completa** | (descreva o baralho e como funciona) |
| **Categoria** | Estilo de vida |
| **Classificação etária** | Preencher questionário (geralmente "Todos") |
| **Política de privacidade** | URL para sua política de privacidade |

### Assets gráficos exigidos

| Asset | Tamanho | Como gerar |
|---|---|---|
| **Ícone do app** | 512×512 | `icons/icon-512.png` |
| **Feature graphic** | 1024×500 | Criar com design contendo logo + "Na Roda" |
| **Screenshots (2+)** | 1080×1920 | Prints do app no celular, ou gerar com `npx pwabuilder-screenshot` |
| **Screenshot tablet (1+)** | 1920×1080 | Print em janela larga ou simulador Android |

Dica para screenshots: use o **PWABuilder Screenshot Generator**:

```bash
npx @pwabuilder/screenshot-generator \
  --url https://pmarkun.github.io/naroda/ \
  --output ./screenshots
```

### Política de privacidade

Você precisa de uma página de privacidade ativa em HTTPS. Crie
`privacidade.html` no repositório:

```bash
cat > privacidade.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Privacidade — Na Roda</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:auto;padding:20px">
  <h1>Política de Privacidade</h1>
  <p>O aplicativo Na Roda não coleta, armazena ou compartilha nenhum dado
  pessoal dos usuários. Nenhuma informação é enviada a servidores externos.</p>
  <p>Todas as perguntas e interações são processadas localmente no dispositivo.
  O app funciona completamente offline após a primeira carga.</p>
  <p>Contato: contato@naroda.app.br</p>
</body>
</html>
EOF
```

Commit e push `privacidade.html`, depois use a URL
`https://pmarkun.github.io/naroda/privacidade.html` na Play Console.

---

## 7. Atualizações futuras

Para cada nova versão:

```bash
# 1. Incrementar versão no twa-manifest.json
#    "appVersionName": "1.1.0"
#    "appVersionCode": 2   (sempre incrementar)

# 2. Rebuild
cd android
bubblewrap build

# 3. Upload do novo AAB na Play Console
```

A Play Store oferece **lançamento gradual (staged rollout)** — você pode
liberar para 10% dos usuários primeiro, monitorar, e depois expandir.

---

## Alternativa: PWABuilder (sem toolchain local)

Se quiser evitar a configuração local do Android SDK:

1. Acesse [pwabuilder.com](https://pwabuilder.com)
2. Insira `https://pmarkun.github.io/naroda/`
3. Clique em **Package for Stores → Android**
4. Gere e baixe o AAB
5. Faça upload na Play Console

Essa opção não exige JDK, Android SDK, nem keystore local (o PWABuilder
gerencia o signing). Menos controle, mais simples.

---

## Checklist final

- [ ] Conta Google Play criada (USD 25)
- [ ] `naroda.keystore` gerado e guardado
- [ ] `android/twa-manifest.json` configurado
- [ ] `bubblewrap build` gera AAB sem erros
- [ ] App testado localmente com `bundletool`
- [ ] Screenshots gerados (2+ celular, 1+ tablet)
- [ ] Feature graphic 1024×500 criado
- [ ] Política de privacidade publicada
- [ ] AAB enviado para Play Console
- [ ] Lançamento publicado (inicialmente em produção ou teste fechado)
