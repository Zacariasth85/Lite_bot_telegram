// Database/context.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, "contexto.db");

// Conecta ao banco de dados (ou cria se não existir)
const db = new sqlite3.Database(dbPath);

// Cria a tabela de contexto (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chat_id, user_id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);
});

// Função para obter ou criar uma conversa
async function getOrCreateConversation(chatId, userId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM conversations WHERE chat_id = ? AND user_id = ?",
      [chatId, userId],
      (err, row) => {
        if (err) return reject(err);
        
        if (row) {
          // Atualiza o timestamp da última interação
          db.run(
            "UPDATE conversations SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?",
            [row.id]
          );
          resolve(row.id);
        } else {
          // Cria uma nova conversa
          db.run(
            "INSERT INTO conversations (chat_id, user_id) VALUES (?, ?)",
            [chatId, userId],
            function(err) {
              if (err) return reject(err);
              resolve(this.lastID);
            }
          );
        }
      }
    );
  });
}

// Função para adicionar uma mensagem ao contexto
async function addMessage(chatId, userId, role, content) {
  try {
    const conversationId = await getOrCreateConversation(chatId, userId);
    
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
        [conversationId, role, content],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    throw error;
  }
}

// Função para obter o histórico de mensagens recentes (limitado a N mensagens)
async function getRecentMessages(chatId, userId, limit = 10) {
  try {
    const conversationId = await getOrCreateConversation(chatId, userId);
    
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT role, content FROM messages 
         WHERE conversation_id = ? 
         ORDER BY timestamp DESC LIMIT ?`,
        [conversationId, limit],
        (err, rows) => {
          if (err) return reject(err);
          // Inverte a ordem para cronológica (mais antiga primeiro)
          resolve(rows.reverse());
        }
      );
    });
  } catch (error) {
    console.error("Erro ao obter mensagens recentes:", error);
    return []; // Retorna array vazio em caso de erro
  }
}

// Função para limpar conversas antigas (mais de 3 dias)
async function cleanOldConversations() {
  return new Promise((resolve, reject) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const timestamp = threeDaysAgo.toISOString();
    
    db.run(
      "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE last_interaction < ?)",
      [timestamp],
      function(err) {
        if (err) return reject(err);
        
        db.run(
          "DELETE FROM conversations WHERE last_interaction < ?",
          [timestamp],
          function(err) {
            if (err) return reject(err);
            resolve(this.changes); // Retorna o número de conversas excluídas
          }
        );
      }
    );
  });
}

module.exports = {
  addMessage,
  getRecentMessages,
  cleanOldConversations
};
