const Database = require('better-sqlite3');

function initDatabase(dbPath) {
  const db = new Database(dbPath);
  
  // 启用 WAL 模式以提高性能
  db.pragma('journal_mode = WAL');
  
  // 创建表
  db.exec(`
    -- API Keys 表
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY,
      api_key TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('cloud', 'manual')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 模型配置表
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id TEXT UNIQUE NOT NULL,
      model_name TEXT NOT NULL,
      model_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 生成历史表
    CREATE TABLE IF NOT EXISTS generation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      params TEXT,
      result_urls TEXT,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 设置表
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_history_created_at ON generation_history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_models_model_id ON models(model_id);
  `);
  
  return db;
}

module.exports = { initDatabase };
