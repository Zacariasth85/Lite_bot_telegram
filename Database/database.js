const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Caminho para o banco de dados na pasta Database
const dbPath = path.join(__dirname, "..", "Database", "videos.db");

// Cria ou abre o banco de dados
const db = new sqlite3.Database(dbPath);

// Cria a tabela de vídeos (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Função para inserir um vídeo no banco de dados
function insertVideo(filePath) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO videos (file_path) VALUES (?)",
      [filePath],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID); // Retorna o ID do vídeo inserido
      }
    );
  });
}

// Função para deletar um vídeo do banco de dados
function deleteVideo(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM videos WHERE id = ?", [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { db, insertVideo, deleteVideo };
