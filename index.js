const { Telegraf, Markup } = require("telegraf");
const { TELEGRAM_BOT_TOKEN } = require("./config");
const { deepseekChat } = require("./services/deepseek-api");
const { attp, gpt4, playAudio, playVideo, ttp, welcome, deleteVideo, gerarImagem } = require("./services/spider-x-api");
const fs = require("fs");
const path = require("path");
const { chatWithGroq } = require("./services/groq_cloud.js");
const { deleteOldImages } = require("./Database/imagem");
const { getMessageStats, getTopCommands, logMessage } = require("./Database/statics");
const { addMessage, getRecentMessages, cleanOldConversations } = require("./Database/context");
const os = require("os");

// Verifica se o token do bot do Telegram está configurado
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("Token do bot do Telegram não configurado!");
}

// Inicializa o bot do Telegram
const bot = new Telegraf(TELEGRAM_BOT_TOKEN, {
  telegram: {
    agent: null, // Usa o agente padrão
    timeout: 30000, // Aumenta o timeout para 30 segundos
  },
});

// ID do dono do bot (substitua pelo seu ID)
const OWNER_ID = 7095213060;

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
/deepseek - Interagir com a DeepSeek AI.
/gerarimagem - Gera uma imagem com base na descrição.
/estatisticas - Mostra estatísticas do bot.
/limparcontexto - Limpa o histórico de conversa atual.
  `);
});

// Comando para limpar o contexto da conversa
bot.command("limparcontexto", async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  
  try {
    // Cria uma nova conversa (efetivamente abandonando a anterior)
    const conversationId = await getOrCreateConversation(chatId, userId);
    
    // Limpa todas as mensagens da conversa
    await new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM messages WHERE conversation_id = ?",
        [conversationId],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
    
    ctx.reply("✅ Contexto da conversa foi limpo. Podemos começar uma nova conversa!");
  } catch (error) {
    console.error("Erro ao limpar contexto:", error);
    ctx.reply("Erro ao limpar o contexto. Tente novamente mais tarde.");
  }
});

// Comandando /chat para interragir com o bot
bot.on("text", async (ctx, next) => {
  const message = ctx.message.text;
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  // Se a mensagem começar com "/", passa para os handlers de comando normalmente
  if (message.startsWith("/")) {
    return next();
  }

  try {
    // Registra a mensagem nas estatísticas
    await logMessage(chatId, userId, message, false);
    
    // Salva a mensagem do usuário no contexto
    await addMessage(chatId, userId, "user", message);
    
    // Obtém as mensagens recentes para construir o contexto
    const recentMessages = await getRecentMessages(chatId, userId);
    const formattedMessages = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Adiciona a mensagem atual se não estiver na lista
    if (!formattedMessages.some(msg => 
      msg.role === "user" && msg.content === message)) {
      formattedMessages.push({ role: "user", content: message });
    }
    
    ctx.reply("Pensando... ⏳");
    
    // Passa o contexto completo para a API da Groq
    const response = await chatWithGroq(formattedMessages);
    
    // Salva a resposta no contexto
    await addMessage(chatId, userId, "assistant", response);
    
    ctx.reply(response);
    
    // Limpa conversas antigas a cada 100 interações (aproximadamente)
    if (Math.random() < 0.01) {
      await cleanOldConversations();
    }
  } catch (error) {
    console.error("Erro:", error);
    ctx.reply("Erro ao processar sua mensagem. Tente novamente mais tarde.");
  }
});

// Objeto para armazenar o número de comandos usados por usuário
const commandUsage = {};

// Função para verificar e atualizar o limite de comandos
function checkCommandLimit(userId, command) {
  if (userId === OWNER_ID) {
    return true; // O dono não tem limite
  }

  const today = new Date().toISOString().split('T')[0];
  const userCommands = commandUsage[userId] || { date: today, count: 0 };

  if (userCommands.date !== today) {
    userCommands.date = today;
    userCommands.count = 0;
  }

  if (userCommands.count >= 5) {
    return false;
  }

  userCommands.count++;
  commandUsage[userId] = userCommands;
  return true;
}

// Função para verificar se um usuário é admin em um grupo
async function isAdmin(ctx) {
  try {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const chatMember = await ctx.telegram.getChatMember(chatId, userId);
    return ["creator", "administrator"].includes(chatMember.status);
  } catch (error) {
    console.error("Erro ao verificar status de admin:", error);
    return false;
  }
}

//Comando de estatisticas
bot.command("estatisticas", async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const isGroup = ctx.chat.type !== "private";

  // Verifica se o usuário é o dono ou um admin (em grupos)
  if (userId !== OWNER_ID && (!isGroup || !(await isAdmin(ctx)))) {
    return ctx.reply("Você não tem permissão para usar este comando.");
  }

  try {
    let statsMessage = "📊 *Estatísticas do Bot*\n\n";

    // Estatísticas do servidor (apenas para o dono)
    if (userId === OWNER_ID) {
      const freeMemory = os.freemem() / 1024 / 1024; // Memória livre em MB
      const totalMemory = os.totalmem() / 1024 / 1024; // Memória total em MB
      const storageUsed = await getStorageUsage(); // Armazenamento usado

      statsMessage += `*Servidor:*\n`;
      statsMessage += `- Memória livre: ${freeMemory.toFixed(2)} MB\n`;
      statsMessage += `- Memória total: ${totalMemory.toFixed(2)} MB\n`;
      statsMessage += `- Armazenamento usado: ${storageUsed} MB\n\n`;
    }

    // Estatísticas de mensagens
    const messageStats = await getMessageStats(isGroup ? chatId : null);
    statsMessage += `*Mensagens:*\n`;
    statsMessage += `- Total: ${messageStats.total_messages}\n`;
    statsMessage += `- Comandos: ${messageStats.total_commands}\n\n`;

    // Comandos mais usados (apenas para o dono)
    if (userId === OWNER_ID) {
      const topCommands = await getTopCommands();
      statsMessage += `*Comandos mais usados:*\n`;
      topCommands.forEach((cmd, index) => {
        statsMessage += `${index + 1}. ${cmd.message}: ${cmd.usage_count} usos\n`;
      });
    }

    await ctx.reply(statsMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    await ctx.reply("Ocorreu um erro ao gerar as estatísticas.");
  }
});

//calcular o armazenamento
async function getStorageUsage() {
  try {
    const stats = fs.statSync("Database/images");
    const sizeInMB = stats.size / 1024 / 1024; // Tamanho em MB
    return sizeInMB.toFixed(2);
  } catch (error) {
    console.error("Erro ao calcular armazenamento:", error);
    return "N/A";
  }
}

//Comando para gerar imagem
bot.command("gerarimagem", async (ctx) => {
  const userId = ctx.from.id;
  if (!checkCommandLimit(userId, "gerarimagem")) {
    return ctx.reply("Você atingiu o limite de 5 comandos por dia.");
  }

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar uma descrição para gerar a imagem!");
  }

  try {
    // Envia uma mensagem de carregamento
    await ctx.reply("Gerando imagem... ⏳");

    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/gerarimagem ${text}`, true);

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
  const userId = ctx.from.id;
  const prompt = ctx.message.text.split(" ").slice(1).join(" ");
  if (!prompt) {
    return ctx.reply("Você precisa informar uma mensagem para a DeepSeek!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/deepseek ${prompt}`, true);
    
    const response = await deepseekChat(prompt);

    // Envia a resposta da DeepSeek
    await ctx.reply(response);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para tocar áudio
bot.command("playaudio", async (ctx) => {
  const userId = ctx.from.id;
  if (!checkCommandLimit(userId, "playaudio")) {
    return ctx.reply("Você atingiu o limite de 5 comandos por dia.");
  }

  const search = ctx.message.text.split(" ").slice(1).join(" ");
  if (!search) {
    return ctx.reply("Você precisa informar o que deseja buscar!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/playaudio ${search}`, true);
    
    await ctx.reply("Buscando a música... ⏳");

    const { name, path } = await playAudio(search);

    await ctx.reply(`🎵 ${name}`);
    await ctx.replyWithAudio({ source: fs.createReadStream(path) });
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
}); 

// Comando para tocar vídeo
bot.command("playvideo", async (ctx) => {
  const userId = ctx.from.id;
  if (!checkCommandLimit(userId, "playvideo")) {
    return ctx.reply("Você atingiu o limite de 5 comandos por dia.");
  }

  const search = ctx.message.text.split(" ").slice(1).join(" ");
  if (!search) {
    return ctx.reply("Você precisa informar o que deseja buscar!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/playvideo ${search}`, true);
    
    // Envia uma mensagem de carregamento
    await ctx.reply("Buscando o vídeo... ⏳");

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
  const userId = ctx.from.id;
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/gpt4 ${text}`, true);
    
    const response = await gpt4(text);
    ctx.reply(response);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar sticker ATT
bot.command("attp", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/attp ${text}`, true);
    
    const stickerUrl = await attp(text);
    ctx.replyWithSticker(stickerUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar sticker TTP
bot.command("ttp", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) {
    return ctx.reply("Você precisa informar o texto!");
  }

  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/ttp ${text}`, true);
    
    const stickerUrl = await ttp(text);
    ctx.replyWithSticker(stickerUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Comando para gerar imagem de boas-vindas
bot.command("welcome", async (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 3) {
    return ctx.reply("Você precisa informar o texto, descrição e URL da imagem!");
  }

  const [text, description, imageURL] = args;
  try {
    // Registra o comando nas estatísticas
    await logMessage(ctx.chat.id, userId, `/welcome ${text} ${description} ${imageURL}`, true);
    
    const welcomeImageUrl = await welcome(text, description, imageURL);
    ctx.replyWithPhoto(welcomeImageUrl);
  } catch (error) {
    ctx.reply(`Erro: ${error.message}`);
  }
});

// Inicia o bot
bot.launch();

console.log("✅Bot iniciado com sucesso!🚀");

// Limpa conversas antigas ao iniciar
cleanOldConversations()
  .then(count => console.log(`Limpeza inicial: ${count} conversas antigas removidas`))
  .catch(err => console.error("Erro na limpeza inicial:", err));

// Capturar erros
process.on("uncaughtException", (err) => console.error("Erro não tratado:", err));
process.on("unhandledRejection", (err) => console.error("Rejeição não tratada:", err));

// Capturar encerramento para fechar corretamente
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
