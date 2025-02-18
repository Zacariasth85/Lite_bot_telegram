const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { SPIDER_API_TOKEN, SPIDER_API_BASE_URL } = require("../config");
const { insertVideo, deleteVideo } = require("../Database/database");
const { insertImage } = require("../Database/imagem");


async function gerarImagem(text) {
  if (!text) {
    throw new Error("Você precisa informar uma descrição para gerar a imagem!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/ai/dall-e?text=${encodeURIComponent(text)}&api_key=${SPIDER_API_TOKEN}`
    );

    // Verifica se a resposta contém o campo "image"
    if (!data.image) {
      throw new Error("URL da imagem não encontrada na resposta da API.");
    }

    // Cria a pasta Database/images se não existir
    const imagesDir = path.join(__dirname, "../Database/images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Baixa a imagem
    const imageUrl = data.image;
    const imagePath = path.join(__dirname, "../Database/images", `image_${Date.now()}.png`);
    const writer = fs.createWriteStream(imagePath);

    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Salva a imagem no banco de dados
    await insertImage(imagePath);

    return {
      path: imagePath, // Caminho local da imagem baixada
      description: text, // Descrição usada para gerar a imagem
    };
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error(`Erro ao gerar imagem: ${error.response?.data?.message || error.message}`);
  }
}


async function playAudio(search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/downloads/play-audio?search=${encodeURIComponent(
        search
      )}&api_key=${SPIDER_API_TOKEN}`
    );

    // Verifica se a URL do áudio está presente na resposta
    if (!data.url) {
      throw new Error("URL do áudio não encontrada na resposta da API.");
    }

    // Retorna os dados do áudio
    return {
      name: data.title || "Faixa Desconhecida", // Usa o título da música
      url: data.url, // Link do áudio
    };
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error(`Erro ao buscar áudio: ${error.response?.data?.message || error.message}`);
  }
}


//função de baixar video
async function playVideo(search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    // Faz a requisição à API do Spider X
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/downloads/play-video?search=${encodeURIComponent(
        search
      )}&api_key=${SPIDER_API_TOKEN}`,
      { timeout: 180000 } //aumenta o tempo de envio para 3 minutos
    );

    // Verifica se o link do vídeo está presente
    if (!data.url) {
      throw new Error("URL do vídeo não encontrada na resposta da API.");
    }

    // Baixa o vídeo
    const videoPath = await downloadVideo(data.url);

    // Armazena o vídeo no banco de dados
    const videoId = await insertVideo(videoPath);

    return {
      id: videoId,
      path: videoPath,
      title: data.title || "Vídeo Desconhecido",
    };
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error(`Erro ao buscar vídeo: ${error.response?.data?.message || error.message}`);
  }
}

// Função para baixar o vídeo
async function downloadVideo(url) {
  const response = await axios({
    url,
    responseType: "stream",
    timeout: 180000,
  });

  // Cria a pasta Database/videos se não existir
  const videosDir = path.join(__dirname, "..", "Database", "videos");
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const videoPath = path.join(videosDir, `${Date.now()}.mp4`);
  const writer = fs.createWriteStream(videoPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(videoPath));
    writer.on("error", reject);
  });
}

//função do chatgpt4
async function gpt4(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.post(
      `${SPIDER_API_BASE_URL}/ai/gpt-4?api_key=${SPIDER_API_TOKEN}`,
      { text }
    );

    return data.response;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar resposta com GPT-4. Verifique os logs para mais detalhes.");
  }
}

async function attp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(
        text
      )}&api_key=${SPIDER_API_TOKEN}`
    );

    return data.url;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar sticker ATT. Verifique os logs para mais detalhes.");
  }
}

async function ttp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(
        text
      )}&api_key=${SPIDER_API_TOKEN}`
    );

    return data.url;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar sticker TTP. Verifique os logs para mais detalhes.");
  }
}

async function welcome(text, description, imageURL) {
  if (!text || !description || !imageURL) {
    throw new Error("Você precisa informar o texto, descrição e URL da imagem!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/canvas/welcome?text=${encodeURIComponent(
        text
      )}&description=${encodeURIComponent(
        description
      )}&image_url=${encodeURIComponent(imageURL)}&api_key=${SPIDER_API_TOKEN}`
    );

    return data.url;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar imagem de boas-vindas. Verifique os logs para mais detalhes.");
  }
}

module.exports = {
  playAudio,
  playVideo,
  deleteVideo,
  gpt4,
  attp,
  ttp,
  welcome,
  gerarImagem,
};
