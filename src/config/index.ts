import dotenv from 'dotenv'

dotenv.config();

const config = {
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    RSS_FEED_URLS: process.env.RSS_FEED_URLS,
    CHECK_INTERVAL: Number(process.env.CHECK_INTERVAL) || 60000,
    CHANNEL_ID: process.env.CHANNEL_ID,
    MONITORED_FORMS: process.env.MONITORED_FORMS?.split(',') || ['N-2A', 'N-2']
};

export default config;