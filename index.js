const { Telegraf, Markup } = require("telegraf");
const { TELEGRAM_BOT_TOKEN } = require("./config");
const { deepseekChat } = require("./services/deepseek-api");
const { attp, gpt4, playAudio, playVideo, ttp, welcome, deleteVideo, gerarImagem } = require("./services/spider-x-api");
const fs = require("fs");
const path = require("path");
const { chatWithGroq } = require("./services/groq_cloud.js");
const { deleteOldImages } = require("./Database/imagem");

// Verifica se o token do bot do Telegram está configurado
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("Token do bot do Telegram não configurado!");
}

// Inicializa o bot do Telegram
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Comando de início
bot.start((ctx) => {
  ctx.reply("Bem-vindo ao bot! Use /help para ver os comandos disponíveis.");
});

// Comando de ajuda
bot.command("help", (ctx) => {
  ctx.reply(`
Comandos disponíveis:
/playaudio <busca> - Toca um áudio.
/playvideo <busca> - Toca um vídeo.
/gpt4 <texto> - Gera uma resposta usando GPT-4.
/attp <texto> - Cria um sticker ATT com o texto.
/ttp <texto> - Cria um sticker TTP com o texto.
/welcome <texto> <descrição> <url da imagem> - Gera uma imagem de boas-vindas.
/deepseek.
/gerarimagem.
  `);
});


// Comandando /chat para interragir com o bot
bot.on("text", async (ctx, next) => {
  const message = ctx.message.text;

  // Se a mensagem começar com "/", passa para os handlers de comando normalmente
  if (message.startsWith("/")) {
    return next();
  }

  // Caso contrário, responde com a API da Groq
  ctx.reply("Pensando... ⏳");
  try {
    const response = await chatWithGroq(message);
    ctx.reply(response);
  } catch (error) {
    ctx.reply("Erro ao processar sua mensagem. Tente novamente mais tarde.");
  }
});

//Comando para gerar imagem
bot.command("gerarimagem", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar uma descrição para gerar a imagem!");
  }

  try {
    // Envia uma mensagem de carregamento
    await ctx.reply("Gerando imagem... ⏳");

    // Gera a imagem usando a API
    const { path, description } = await gerarImagem(text);

    // Envia a imagem gerada
    await ctx.replyWithPhoto({ source: fs.createReadStream(path) }, {
      caption: `🖼️ Imagem gerada para: "${description}"`,
    });

    // Exclui imagens antigas (mais de 7 dias)
    await deleteOldImages();
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});


// Comando para interagir com a DeepSeek
bot.command("deepseek", async (ctx) => {
  const prompt = ctx.message.text.split(" ").slice(1).join(" ");
  if (!prompt) {
    return ctx.reply("Você precisa informar uma mensagem para a DeepSeek!");
  }

  try {
    const response = await deepseekChat(prompt);

    // Envia a resposta da DeepSeek
    await ctx.reply(response);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para tocar áudio
bot.command("playaudio", async (ctx) => {
  const search = ctx.message.text.split(" ").slice(1).join(" ");
  if (!search) {
    return ctx.reply("Você precisa informar o que deseja buscar!");
  }

  try {
    // Envia uma mensagem de carregamento
    await ctx.reply("Carregando... ⏳");

    // Busca o áudio usando a API
    const { name, url } = await playAudio(search);

    // Envia o nome da música
    await ctx.reply(`🎵 ${name}`);

    // Envia o áudio
    await ctx.replyWithAudio(url);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para tocar vídeo
bot.command("playvideo", async (ctx) => {
  const search = ctx.message.text.split(" ").slice(1).join(" ");
  if (!search) {
    return ctx.reply("Você precisa informar o que deseja buscar!");
  }

  try {
    // Envia uma mensagem de carregamento
    await ctx.reply("Carregando... ⏳");

    // Busca o vídeo usando a API
    const { id, path: videoPath, title } = await playVideo(search);

    // Envia o nome do vídeo
    await ctx.reply(`🎥 ${title}`);

    // Envia o vídeo
    await ctx.replyWithVideo({ source: videoPath });

    // Após o envio bem-sucedido, exclui o vídeo do banco de dados e do sistema
    await deleteVideo(id);
    fs.unlinkSync(videoPath);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para usar GPT-4
bot.command("gpt4", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    const response = await gpt4(text);
    ctx.reply(response);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar sticker ATT
bot.command("attp", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    const stickerUrl = await attp(text);
    ctx.replyWithSticker(stickerUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar sticker TTP
bot.command("ttp", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    const stickerUrl = await ttp(text);
    ctx.replyWithSticker(stickerUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar imagem de boas-vindas
bot.command("welcome", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 3) {
    return ctx.reply("Você precisa informar o texto, descrição e URL da imagem!");
  }

  const [text, description, imageURL] = args;
  try {
    const welcomeImageUrl = await welcome(text, description, imageURL);
    ctx.replyWithPhoto(welcomeImageUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Inicia o bot
bot.launch();

console.log("✅Bot iniciado com sucesso!🚀");

// Capturar erros
process.on("uncaughtException", (err) => console.error("Erro não tratado:", err));
process.on("unhandledRejection", (err) => console.error("Rejeição não tratada:", err));
