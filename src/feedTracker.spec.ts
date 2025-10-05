import { Client, TextChannel } from 'discord.js';
import { addChannel, feedNeedsUpdated, getChannels, removeChannel, updateContentHash } from './db';
import { beforeEach, describe, expect, it } from '@jest/globals';

import FeedTracker from './feedTracker';
import Parser from 'rss-parser';
import config from './config';

// Mock dependencies
jest.mock('discord.js');
jest.mock('rss-parser');
jest.mock('./db');
jest.mock('./config', () => ({
  MONITORED_FORMS: ['10-K', '8-K']
}));

describe('FeedTracker', () => {
  let mockClient: Client;
  let mockParser: Parser;
  let feedTracker: FeedTracker;
  let mockParseURL: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock channel that will be returned by channels.cache.get()
    const mockChannel = {
      isTextBased: jest.fn().mockReturnValue(true),
      isSendable: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined)
    };

    mockClient = {
      guilds: {
        cache: new Map([['test-guild', {
          id: 'test-guild',
          channels: {
            cache: new Map([['test-channel', {
              isTextBased: jest.fn().mockReturnValue(true),
              isSendable: jest.fn().mockReturnValue(true),
              send: jest.fn()
            }]])
          }
        }]])
      },
      channels: {
        cache: {
          get: jest.fn().mockReturnValue(mockChannel) // Return the mock channel
        }
      }
    } as any;

    mockParseURL = jest.fn();
    mockParser = {
      parseURL: mockParseURL
    } as any;

    (Parser as jest.MockedClass<typeof Parser>).mockImplementation(() => mockParser);
    (feedNeedsUpdated as jest.MockedFunction<typeof feedNeedsUpdated>).mockReturnValue(true);
    (updateContentHash as jest.MockedFunction<typeof updateContentHash>).mockImplementation(jest.fn());
    (getChannels as jest.MockedFunction<typeof getChannels>).mockReturnValue([{ id: 'test-channel', name: 'test-channel', guildId: 'test-guild' }]);
    (addChannel as jest.MockedFunction<typeof addChannel>).mockImplementation(jest.fn());
    (removeChannel as jest.MockedFunction<typeof removeChannel>).mockImplementation(jest.fn());

    feedTracker = new FeedTracker(mockClient, ['https://test-feed.com']);

    // Manually set up the channels array that FeedTracker uses
    feedTracker['channels'] = [{ id: 'test-channel', name: 'test-channel', guildId: 'test-guild' }];
  });

  describe('checkFeed', () => {
    it('should correctly map RSS feed items to FeedItem objects', async () => {
      const mockRssItems = [
        {
          title: 'Test Filing 1',
          link: 'https://test-feed.com',
          summary: 'Test summary 1',
          id: 'test-id-1',
          contentType: {
            'acceptance-date-time': '2023-12-01T10:00:00Z',
            'accession-number': 'ACC001',
            'filing-date': '2023-12-01',
            'filing-href': 'https://example.com/filing1.html',
            'form-name': '10-K',
            'size': '1024'
          },
          category: {
            $: { label: 'Category1', scheme: 'http://www.sec.gov/edgar', term: 'term1' }
          }
        },
        {
          title: 'Test Filing 2',
          link: 'https://example.com/filing2',
          summary: 'Test summary 2',
          id: 'test-id-2',
          contentType: {
            'acceptance-date-time': '2023-12-02T11:00:00Z',
            'accession-number': 'ACC002',
            'filing-date': '2023-12-02',
            'filing-href': 'https://example.com/filing2.html',
            'form-name': '8-K',
            'size': '2048'
          },
          category: {
            '$': {
              label: 'Category2',
              scheme: 'http://www.sec.gov/edgar',
              term: 'term2'
            }
          }
        }
      ];

      mockParseURL.mockResolvedValue({
        items: mockRssItems
      });

      await feedTracker.checkFeeds();

      expect(mockParseURL).toHaveBeenCalledWith('https://test-feed.com');
      expect(feedNeedsUpdated).toHaveBeenCalledWith('test-id-1');
    });

    it('should handle form names that are monitored', async () => {
      const mockRssItems = [
        {
          title: 'Test Filing',
          link: 'https://example.com/filing',
          summary: 'Test summary',
          id: 'test-id',
          contentType: {
            'acceptance-date-time': '2023-12-01T10:00:00Z',
            'accession-number': 'ACC001',
            'filing-date': '2023-12-01',
            'filing-href': 'https://example.com/filing.html',
            'form-name': '10-K',
            'size': '1024'
          },
          category: {
            $: { label: 'Category1', scheme: 'http://www.sec.gov/edgar', term: '10-K' }
          }
        }
      ];

      mockParseURL.mockResolvedValue({
        items: mockRssItems
      });

      const mockChannel = mockClient.channels.cache.get('test-channel')! as TextChannel;
     
      await feedTracker.checkFeeds();

      // Then expect the send method to have been called
      // expect(mockChannel.send).toHaveBeenCalledWith(`
      //    A filing update for *Test Filing* has been detected:
      //    * 10-K
      //    * https://example.com/filing
      // `);
      expect(mockChannel.send).toHaveBeenCalled();
      expect(updateContentHash).toHaveBeenCalled();
    });

    it('should return early when no updates are needed', async () => {
      const mockRssItems = [
        {
          title: 'Test Filing',
          link: 'https://example.com/filing',
          summary: 'Test summary',
          id: 'test-id',
          contentType: {
            'acceptance-date-time': '2023-12-01T10:00:00Z',
            'accession-number': 'ACC001',
            'filing-date': '2023-12-01',
            'filing-href': 'https://example.com/filing.html',
            'form-name': '10-K',
            'size': '1024'
          },
          category: {
            $: { label: 'Category1', scheme: 'http://www.sec.gov/edgar', term: '10-K' }
          }
        }
      ];

      mockParseURL.mockResolvedValue({
        items: mockRssItems
      });

      (feedNeedsUpdated as jest.MockedFunction<typeof feedNeedsUpdated>).mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

      await feedTracker.checkFeeds();

      expect(consoleSpy).toHaveBeenCalledWith('No new updates.');
      expect(updateContentHash).not.toHaveBeenCalled();
    });

    it('should add a new channel when guild does not exist', () => {
      const newChannel = { id: 'new-channel', name: 'new-channel', guildId: 'new-guild' };

      feedTracker.addChannel(newChannel);

      expect(feedTracker['channels']).toContain(newChannel);
      expect(feedTracker['channels']).toHaveLength(2);
    });

    it('should replace existing channel when guild already exists', () => {
      const existingGuildId = 'test-guild';
      const newChannel = { id: 'updated-channel', name: 'updated-channel', guildId: existingGuildId };

      feedTracker.addChannel(newChannel);

      const channelsForGuild = feedTracker['channels'].filter(c => c.guildId === existingGuildId);
      expect(channelsForGuild).toHaveLength(1);
      expect(channelsForGuild[0]).toEqual(newChannel);
      expect(feedTracker['channels']).toHaveLength(1);
    });

    it('should maintain other channels when replacing a channel for existing guild', () => {
      const anotherChannel = { id: 'another-channel', name: 'another-channel', guildId: 'another-guild' };
      feedTracker.addChannel(anotherChannel);

      const replacementChannel = { id: 'replacement-channel', name: 'replacement-channel', guildId: 'test-guild' };
      feedTracker.addChannel(replacementChannel);

      expect(feedTracker['channels']).toContain(anotherChannel);
      expect(feedTracker['channels']).toContain(replacementChannel);
      expect(feedTracker['channels']).toHaveLength(2);
    });
  });
});