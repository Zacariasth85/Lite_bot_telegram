const axios = require("axios");

const DEEPSEEK_API_KEY = "sk-3f87809748d84e45819e5d618b5f17e5"; // Sua chave da API da DeepSeek
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // URL da API da DeepSeek

async function deepseekChat(prompt) {
  if (!prompt) {
    throw new Error("Você precisa informar o prompt!");
  }

  if (!DEEPSEEK_API_KEY) {
    throw new Error("Chave da API da DeepSeek não configurada!");
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat", // Modelo da DeepSeek
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Retorna a resposta gerada pela API
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw new Error("Erro ao gerar resposta com a DeepSeek. Verifique os logs para mais detalhes.");
  }
}

module.exports = {
  deepseekChat,
};
