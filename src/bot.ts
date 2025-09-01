import { Client, GatewayIntentBits } from 'discord.js';

import FeedTracker from './feedTracker';
import config from './config/index';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const feedTracker = new FeedTracker(client, config.RSS_FEED_URLS!.split('|'));
const interval = config.CHECK_INTERVAL

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    feedTracker.startTracking(interval);
});

client.login(config.DISCORD_BOT_TOKEN);