import Database from 'better-sqlite3';

const db = new Database('rssbot.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS feeds (
    id TEXT PRIMARY KEY,
    rssFeedUrl TEXT NOT NULL,
    lastContentId TEXT NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export function feedNeedsUpdated(lastContentId: string): boolean {
  const row = db.prepare('SELECT 1 FROM feeds WHERE lastContentId = ?').get(lastContentId);
  return !row;
}

export function updateContentHash(rssFeedUrl: string, lastContentId: string) {
  try {
    db.prepare('INSERT OR REPLACE INTO feeds (rssFeedUrl, lastContentId) VALUES (?, ?)').run(rssFeedUrl, lastContentId);
  } catch (error) {
    console.error('Error updating content hash:', error);
  }
}