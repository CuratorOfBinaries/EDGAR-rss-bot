import Database from 'better-sqlite3';

const db = new Database('rssbot.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS feeds (
    id TEXT PRIMARY KEY,
    rssFeedUrl TEXT NOT NULL,
    lastContentId TEXT NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
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

export function addChannel(channelId: string, guildId: string, name: string) {
  try {
    db.prepare('INSERT OR REPLACE INTO channels (channelId, guildId, name) VALUES (?, ?, ?)').run(channelId, guildId, name);
  } catch (error) {
    console.error('Error adding channel:', error);
  }
}

export function getChannels(): { id: string; guildId: string; name: string }[] {
  return db.prepare('SELECT channelId, guildId, name FROM channels').all().map((row: any) =>
    ({ id: row.channelId, guildId: row.guildId, name: row.name }));
}

export function removeChannel(guildId: string) {
  try {
    db.prepare('DELETE FROM channels WHERE guildId = ?').run(guildId);
  } catch (error) {
    console.error('Error removing channel:', error);
  }
}