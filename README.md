# Na Roda

Um baralho digital de perguntas para conversas significativas.
Versão PWA para celular — adicione na tela de início e use offline.

## Como Jogar

Leia a pergunta em voz alta. Responda.

## Onde Jogar

- Refeições com amigos ou família
- Encontros românticos
- Papo de bar
- Filas de espera
- Viagens de carro, ônibus, avião, lhama
- Lugares com pessoas
- Lugares sem pessoas

## Quem Criou

O mundo incomoda o Gabriel e o Gabriel incomoda o mundo. E é por essa
reciprocidade que ele preenche grande parte dos seus dias pensando em estruturas
horizontais e cooperativas, rodas e jogos. Ele preserva há quase trinta anos o
hábito de não perder a chance de fazer boas perguntas e colocar todo mundo para
pensar junto.

A Maisa é do tipo que dorme pensando. Executora por imposição solar em áries,
ela é cheia de ideias femininas e feministas. Eventualmente sofre de uma súbita
vontade de dar uma volta correndo no quarteirão. Ela usa de boas perguntas como
processo de cura para si e para quem mais estiver próximo.

[contato@naroda.app.br](mailto:contato@naroda.app.br)

## Estrutura do projeto

```
├── index.html          # Entrada do PWA
├── manifest.json       # Manifest PWA
├── sw.js               # Service worker
├── src/                # Código fonte
│   ├── app.js
│   ├── styles.css
│   └── fonts.css
├── data/               # Dados do baralho
│   ├── questions.json
│   └── about.json
├── fonts/              # Fontes self-hosted (OFL)
│   ├── Inter.woff2
│   ├── PlayfairDisplay.woff2
│   └── PlayfairDisplay-Italic.woff2
├── icons/              # Ícones do PWA
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   └── logo_original.png
└── assets/             # Arquivos fonte
    └── base.csv
```

## Como usar

```bash
python3 -m http.server 8080
```

## Publicar no GitHub Pages

1. Crie um repositório chamado `naroda`
2. Push os arquivos para a branch `main`
3. Settings → Pages → Source: `main`, pasta: `/`
4. O app estará disponível em `https://seuusuario.github.io/naroda/`
5. No celular, abra o link e escolha **Compartilhar → Adicionar à Tela de Início**

## Funcionalidades

- 123 perguntas em 4 categorias
- Swipe para navegar entre perguntas
- Modo escuro (padrão)
- PWA com cache offline
- Compartilhar pergunta como imagem para stories
- Tela de apresentação na primeira vez
- Navegação por teclado (setas + espaço)

## Licença

MIT
