const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', 'db', 'employdex-base.db');
const db = new sqlite3.Database(dbPath);

function executeSqlScript(filePath) {
  return new Promise((resolve, reject) => {
    const sqlScript = fs.readFileSync(filePath, 'utf8');
    const sqlStatements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;');
      sqlStatements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              console.error('Error executing SQL statement:', err.message);
              console.error('Statement:', statement);
              db.run('ROLLBACK;');
              reject(err);
            }
          });
        }
      });
      db.run('COMMIT;', (err) => {
        if (err) {
          console.error('Error committing transaction:', err.message);
          reject(err);
        } else {
          console.log('SQL script executed successfully.');
          resolve();
        }
      });
    });
  });
}

async function up() {
  console.log('Running migration: Add groups and media tables');
  const scriptPath = path.resolve(__dirname, '..', 'db', 'v2_add_groups_and_media_tables.sql');
  await executeSqlScript(scriptPath);
}

async function down() {
  console.log('Running migration: Drop groups and media tables');
  const downScript = `
    DROP TABLE IF EXISTS media;
    DROP TABLE IF EXISTS group_members;
    DROP TABLE IF EXISTS groups;
  `;
  
  return new Promise((resolve, reject) => {
    const statements = downScript.split(';').filter(stmt => stmt.trim() !== '');
    db.serialize(() => {
      statements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement, (err) => {
            if (err) {
              console.error('Error dropping tables:', err);
              reject(err);
            }
          });
        }
      });
      console.log('Successfully dropped groups and media tables');
      resolve();
    });
  });
}

// Check for command line arguments to run up or down
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === 'up') {
    up().finally(() => db.close());
  } else if (arg === 'down') {
    down().finally(() => db.close());
  } else {
    console.log('Please specify "up" or "down" as an argument.');
  }
}

module.exports = { up, down };
