import { ChannelInfo, CustomFeedItem, FeedItem } from './types';

import { Client } from 'discord.js';
import Parser from 'rss-parser';
import config from './config';
import { createHash } from 'crypto'
import { feedNeedsUpdated, updateContentHash } from './db';

class FeedTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private parser: Parser;
  private feedUrls: string[];
  private channels: ChannelInfo[];
  private client: Client;

  constructor(client: Client, feedUrls: string[]) {
    this.client = client;
    this.feedUrls = feedUrls;
    this.channels = [];
    this.parser = new Parser<CustomFeedItem>({
      customFields: {
        item: [
          ['content-type', 'contentType'],
          ['category', 'category']
        ]
      }
    });
  }

  public startTracking(interval: number) {
    if (this.intervalId) {
      return; // Already tracking
    }

    this.getAvailableChannels();
    this.intervalId = setInterval(() => this.checkFeeds().catch(console.error), interval);
  }

  public stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async checkFeeds() {
    if(!this.channels.length) {
      this.getAvailableChannels();
    }
    const tasks = this.feedUrls.map(async (url) => {
      try {
        console.debug('Checking feed:', url);
        const feed = await this.parser.parseURL(url);
        const feedItems: FeedItem[] = feed.items.map(item => {
          const content = item.contentType;
          const category = item.category
          
          return {
            title: item.title!,
            link: item.link!,
            summary: item.summary!,
            id: item.id!,
            acceptanceDateTime: new Date(content['acceptance-date-time']),
            accessionNumber: content['accession-number'],
            filingDate: content['filing-date'],
            filingHref: content['filing-href'],
            formName: content['form-name'],
            size: content['size'],
            category: { term: category.$['term'] }
          } satisfies FeedItem
        });

        const latestEntry = feedItems[0];

        if (!feedNeedsUpdated(latestEntry.id)) {
          console.log('No new updates.');
          return; // Add return here
        }

        if (config.MONITORED_FORMS.includes(latestEntry.category.term)) {
          console.log(`
            A filing update for *${latestEntry.title}* has been detected: 
            * ${latestEntry.formName}
            * ${latestEntry.link}
            `);
          updateContentHash(url, latestEntry.id);
          
          // Send to all channels before resolving
          const notifications = this.channels.map(async (channel) => {
            const textChannel = this.client.channels.cache.get(channel.id);
            if (textChannel?.isSendable()) {
              await textChannel.send(`
            A filing update for *${feed.title}* has been detected: 
              * ${latestEntry.formName} (${latestEntry.category.term})
              * ${latestEntry.link}
            `);
            }
          });
          
          await Promise.all(notifications);
        } else {
          console.log('No new updates.');
          updateContentHash(url, latestEntry.id);
        }
      } catch (error) {
        console.error('Error checking feeds:', error);
        throw error; // Re-throw to be handled by Promise.all
      }
    });

    await Promise.all(tasks);
  }

  private getAvailableChannels() {
    this.client.guilds.cache.forEach(guild => {
      guild.channels.cache.forEach(channel => {
        if(channel.isTextBased() 
          && channel.isSendable()
        ) {
          this.channels.push({
            id: channel.id,
            name: channel.name,
            guildId: guild.id
          })
        }
      });
    })
  }
}

export default FeedTracker;