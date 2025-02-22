# 🤖 Telegram Bot: Lite Bot telegram

Um bot do Telegram moderno e poderoso, integrado com várias APIs para fornecer funcionalidades avançadas, como busca de áudios, vídeos, geração de stickers, respostas de IA e muito mais!

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://core.telegram.org/bots)

---

## ✨ Funcionalidades

O **Lite Bot** oferece uma variedade de comandos para facilitar sua vida no Telegram. Aqui estão algumas das funcionalidades disponíveis:

### 🎵 **Áudio e Vídeo**
- `/playaudio <busca>`: Busca e toca um áudio com base na sua pesquisa.
- `/playvideo <busca>`: Busca e reproduz um vídeo com base na sua pesquisa.

### 🤖 **IA e GPT**
- `/gpt4 <texto>`: Gera uma resposta usando GPT-4.
- `/groq <texto>`: Gera uma resposta usando a API da Groq Cloud.
- `/traduzir <texto>`: Traduz um texto para inglês.
- `/resumir <texto>`: Resume um texto de forma concisa.

### 🎨 **Stickers e Imagens**
- `/attp <texto>`: Cria um sticker ATT com o texto fornecido.
- `/ttp <texto>`: Cria um sticker TTP com o texto fornecido.
- `/welcome <texto> <descrição> <url da imagem>`: Gera uma imagem de boas-vindas personalizada.

### 🛠 **Utilitários**
- `/cep <CEP>`: Consulta informações de um CEP.
- `/ping`: Verifica se o bot está online.

### ⚠️ **Aviso**
- Alguns comandos não estão funcionando ou não estão completamente implementados:
- `/attp`.
- `/ttp`.
- `/ping`.
- `/groq`: para interagir com a API da groq_cloud, basta enviar qualquer mensagem sem usar o prefixo "/".

---

## 🚀 Como Usar

### 1. **Adicione o Bot no Telegram**
Procure pelo bot no Telegram e inicie uma conversa com ele. Use o comando `/help` para ver a lista de comandos disponíveis.

---

### 2. **Comandos Básicos**
- Para tocar um áudio: `/playaudio MC Kevinho`
- Para gerar uma resposta de IA: `/gpt4 Qual é a capital da França?`
- Para criar um sticker: `/attp Hello World`

---

## ⚙️ Configuração

### 1. **Clone o Repositório**
```bash
git clone https://github.com/Zacariasth85/Lite_bot_telegram.git
cd Lite_bot_telegram
```

### 2. **Instalando as Dependências**
```
npm install
```

### 3. **Configure as Chaves de API**
Crie um arquivo `config.js` na raiz do projeto e adicione as chaves de API necessárias:

```javascript
require('dotenv').config(); // Carrega as variáveis de ambiente

module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  SPIDER_API_TOKEN: process.env.SPIDER_API_TOKEN,
  SPIDER_API_BASE_URL: process.env.SPIDER_API_BASE_URL,
};
```

### 4. **Execute o Bot**
```bash
node index.js
```
Ou

```bash
npm start
```
---

## 🛠 Tecnologias Utilizadas

- **[Node.js](https://nodejs.org/)**: Ambiente de execução JavaScript.
- **[Telegraf](https://telegraf.js.org/)**: Framework para criar bots do Telegram.
- **[Axios](https://axios-http.com/)**: Cliente HTTP para fazer requisições à API.
- **[Spider X API](https://api.spiderx.com.br/)**: API para busca de áudios, vídeos e stickers.
- **[Groq Cloud](https://groq.com/)**: API de IA para geração de respostas.

---

## 📄 Licença
Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos abaixo:

1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

---

## 📞 Contato

Se tiver dúvidas ou sugestões, entre em contato:

- **Email**: zacariasrichard85@gmail.com
- **GitHub**: Zacariasth85
https://github.com/Zacariasth85
- **Telegram**:@maxthBot
https://t.me/maxthBot

---

Feito por Zacarias Thequimo.
https://github.com/Zacariasth85
