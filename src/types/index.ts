export interface BotConfig {
    token: string;
    rssFeedUrl: string;
}

export type CustomFeedItem = {
  contentType: FeedItem
  category: { term: string }
}

export type FeedItem = {
  title: string;
  link: string;
  summary: string;
  id: string;
  acceptanceDateTime: Date;
  accessionNumber: string;
  filingDate: string;
  filingHref: string;
  formName: string;
  size: number;
  category: { term: string };
}

export type ChannelInfo = {
  id: string;
  name: string;
  guildId: string;
}