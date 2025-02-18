require('dotenv').config(); // Carrega as variáveis de ambiente do .env

module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  SPIDER_API_TOKEN: process.env.SPIDER_API_TOKEN,
  SPIDER_API_BASE_URL: process.env.SPIDER_API_BASE_URL,
};
