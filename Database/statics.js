const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, "estatisticas.db");

// Conecta ao banco de dados (ou cria se não existir)
const db = new sqlite3.Database(dbPath);

// Cria a tabela de mensagens (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_command BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Função para registrar uma mensagem
function logMessage(chatId, userId, message, isCommand = false) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO messages (chat_id, user_id, message, is_command)
      VALUES (?, ?, ?, ?)
    `;
    db.run(query, [chatId, userId, message, isCommand], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

// Função para obter estatísticas de mensagens
async function getMessageStats(chatId = null) {
  const query = chatId
    ? `SELECT COUNT(*) as total_messages, COALESCE(SUM(is_command), 0) as total_commands FROM messages WHERE chat_id = ?`
    : `SELECT COUNT(*) as total_messages, COALESCE(SUM(is_command), 0) as total_commands FROM messages`;

  return new Promise((resolve, reject) => {
    db.get(query, chatId ? [chatId] : [], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Função para obter os comandos mais usados
async function getTopCommands(limit = 5) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT message, COUNT(*) as usage_count
      FROM messages
      WHERE is_command = 1
      GROUP BY message
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    db.all(query, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  logMessage,
  getMessageStats,
  getTopCommands,
};
