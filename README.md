# MusicVizualizer

Um visualizador 3D que reage ao ritmo da sua música usando Three.js.

## Como usar

1. Abra o arquivo `index.html` em um navegador moderno (Chrome, Edge ou Firefox).
2. Clique em **Escolha um arquivo MP3** e selecione uma música do seu computador.
3. Ajuste os controles no painel lateral para personalizar o visual (cores, intensidade do brilho, distorção, etc.).

> Dica: use o mouse para orbitar, aproximar e afastar a câmera.

## Tecnologias

- [Three.js](https://threejs.org/) para renderização 3D.
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) para análise de áudio em tempo real.
- [lil-gui](https://github.com/georgealways/lil-gui) para os controles interativos.

## Estrutura

```
.
├── index.html      # Página principal
├── styles.css      # Estilos da interface
└── src
    └── app.js      # Código do visualizador e análise de áudio
```
