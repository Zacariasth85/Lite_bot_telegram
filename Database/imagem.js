const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const moment = require("moment");

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, "imagens.db");

// Conecta ao banco de dados (ou cria se não existir)
const db = new sqlite3.Database(dbPath);

// Cria a tabela de imagens (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Função para inserir uma nova imagem no banco de dados
function insertImage(filePath) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO images (file_path) VALUES (?)`;
    db.run(query, [filePath], function (err) {
      if (err) return reject(err);
      resolve(this.lastID); // Retorna o ID da imagem inserida
    });
  });
}

// Função para excluir uma imagem do banco de dados
function deleteImage(id) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM images WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Função para excluir imagens antigas (mais de 7 dias)
function deleteOldImages() {
  return new Promise((resolve, reject) => {
    const sevenDaysAgo = moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
    const query = `DELETE FROM images WHERE created_at < ?`;
    db.run(query, [sevenDaysAgo], function (err) {
      if (err) return reject(err);
      resolve(this.changes); // Retorna o número de imagens excluídas
    });
  });
}

// Função para buscar todas as imagens
function getAllImages() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM images`;
    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  insertImage,
  deleteImage,
  deleteOldImages,
  getAllImages,
};
