const axios = require("axios");
const { SPIDER_API_TOKEN, SPIDER_API_BASE_URL } = require("../config");

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

    // Retorna apenas o nome da música e o link do áudio
    return {
      name: data.name || "Faixa Desconhecida", // Nome da música
      url: data.url, // Link do áudio
    };
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao buscar áudio. Verifique os logs para mais detalhes.");
  }
}

async function playVideo(search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  if (!SPIDER_API_TOKEN) {
    throw new Error("Token da API do Spider X não configurado!");
  }

  try {
    const { data } = await axios.get(
      `${SPIDER_API_BASE_URL}/downloads/play-video?search=${encodeURIComponent(
        search
      )}&api_key=${SPIDER_API_TOKEN}`
    );

    return data;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao buscar vídeo. Verifique os logs para mais detalhes.");
  }
}

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
  gpt4,
  attp,
  ttp,
  welcome,
};
