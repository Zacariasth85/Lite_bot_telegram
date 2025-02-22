const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { SPIDER_API_TOKEN, SPIDER_API_BASE_URL } = require("../config");
const { insertVideo, deleteVideo } = require("../Database/database");
const { insertImage } = require("../Database/imagem");

//Definição do timeout global
axios.default.timeout = 300000;

// Função para gerar imagem
async function gerarImagem(text) {
  if (!text) throw new Error("Você precisa informar uma descrição para gerar a imagem!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/ai/dall-e?text=${encodeURIComponent(text)}&api_key=${SPIDER_API_TOKEN}`
    );

    if (!data.image) throw new Error("URL da imagem não encontrada na resposta da API.");

    const imagesDir = path.join(__dirname, "../Database/images");
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    const imageUrl = data.image;
    const imagePath = path.join(imagesDir, `image_${Date.now()}.png`);
    const writer = fs.createWriteStream(imagePath);
    
    const response = await axios({ url: imageUrl, method: "GET", responseType: "stream" });
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await insertImage(imagePath);
    return { path: imagePath, description: text };

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error(`Erro ao gerar imagem: ${error.response?.data?.message || error.message}`);
  }
}

// Função para baixar áudio
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


    if (!data.url) {
      throw new Error("URL do áudio não encontrada na resposta da API.");
    }

    console.log("URL do áudio:", data.url);

    // Baixa o arquivo
    const audioDir = path.join(__dirname, "audios");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(audioDir, `audio_${Date.now()}.mp3`);
    const writer = fs.createWriteStream(audioPath);

    // Requisição para baixar o arquivo com cabeçalho de autenticação e User-Agent
    const response = await axios({
      url: data.url,
      method: "GET",
      responseType: "stream",
      headers: {
        Authorization: `Bearer ${SPIDER_API_TOKEN}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return {
      name: data.title || "Faixa Desconhecida",
      path: audioPath,
    };
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error(`Erro ao buscar áudio: ${error.response?.data?.message || error.message}`);
  }
}

// Função para baixar vídeo
async function playVideo(search) {
  if (!search) throw new Error("Você precisa informar o que deseja buscar!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/downloads/play-video?search=${encodeURIComponent(search)}&api_key=${SPIDER_API_TOKEN}`,
      { timeout: 180000 } // Timeout de 3 minutos
    );

    if (!data.url) throw new Error("URL do vídeo não encontrada na resposta da API.");

    const videoPath = await downloadVideo(data.url);
    const videoId = await insertVideo(videoPath);

    return { id: videoId, path: videoPath, title: data.title || "Vídeo Desconhecido" };

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error("Acesso negado à API. Verifique sua chave de API ou permissões.");
    }
    
    throw new Error(`Erro ao buscar vídeo: ${error.response?.data?.message || error.message}`);
  }
}

// Função para baixar e armazenar o vídeo
async function downloadVideo(url) {
  const response = await axios({ url, responseType: "stream", timeout: 180000 });

  const videosDir = path.join(__dirname, "..", "Database", "videos");
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

  const videoPath = path.join(videosDir, `${Date.now()}.mp4`);
  const writer = fs.createWriteStream(videoPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(videoPath));
    writer.on("error", reject);
  });
}

// Função GPT-4
async function gpt4(text) {
  if (!text) throw new Error("Você precisa informar o parâmetro de texto!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.post(`${SPIDER_API_BASE_URL}/ai/gpt-4?api_key=${SPIDER_API_TOKEN}`, { text });
    return data.response;

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar resposta com GPT-4. Verifique os logs para mais detalhes.");
  }
}

// Função ATT
async function attp(text) {
  if (!text) throw new Error("Você precisa informar o parâmetro de texto!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(text)}&api_key=${SPIDER_API_TOKEN}`
    );
    return data.url;

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar sticker ATT. Verifique os logs para mais detalhes.");
  }
}

// Função TTP
async function ttp(text) {
  if (!text) throw new Error("Você precisa informar o parâmetro de texto!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(text)}&api_key=${SPIDER_API_TOKEN}`
    );
    return data.url;

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar sticker TTP. Verifique os logs para mais detalhes.");
  }
}

// Função de boas-vindas
async function welcome(text, description, imageURL) {
  if (!text || !description || !imageURL) throw new Error("Você precisa informar o texto, descrição e URL da imagem!");
  if (!SPIDER_API_TOKEN) throw new Error("Token da API do Spider X não configurado!");

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/canvas/welcome?text=${encodeURIComponent(text)}&description=${encodeURIComponent(description)}&image_url=${encodeURIComponent(imageURL)}&api_key=${SPIDER_API_TOKEN}`
    );
    return data.url;

  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar imagem de boas-vindas. Verifique os logs para mais detalhes.");
  }
}

// Exportação dos módulos
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

