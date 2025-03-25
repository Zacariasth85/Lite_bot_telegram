// services/groq_cloud.js
const axios = require("axios");
const { GROQ_API_KEY } = require("../config");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function chatWithGroq(messages) {
  try {
    // Se receber uma string, converter para formato de mensagens
    if (typeof messages === "string") {
      messages = [{ role: "user", content: messages }];
    }
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao se comunicar com a Groq:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }
}

module.exports = { chatWithGroq };
