import { Client, GatewayIntentBits } from 'discord.js';

import FeedTracker from '../feedTracker';
import config from '../config/index';

( async () => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

  client.login(config.DISCORD_BOT_TOKEN);

  client.once('ready', async () => {
    const feedTracker = new FeedTracker(client, config.RSS_FEED_URLS!.split('|'));
    await feedTracker.checkFeeds();
  });
})();