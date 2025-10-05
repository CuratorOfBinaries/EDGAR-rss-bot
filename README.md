# EDGAR RSS Monitor Discord Bot

This bot monitors the rss feeds of filings of companies on EDGAR

# Installation

### Discord

In order to install the discord bot to the server, the user will need to click on a oauth2 link. This link will be shared when requested. Once they have click on the link, they will be prompted to allow the discord bot to added to the server along with required permissions.

The configuration channel will be created and only will be accessible by the admins of the server.

**SCREENSHOT**

# How to Run

Firstly, ensure that environment variables are configured:

| Variable | Description | Example |
|----------|-------------|---------|
| `RSS_FEED_URLS` | The RSS feed you would like to monitor on EDGAR | `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=&company=&dateb=&owner=include&start=0&count=40&output=atom` |
| `CHECK_INTERVAL` | How often to monitor the feeds in milliseconds | `60000` |
| `MONITORED_FORMS` | Which filings to alert on based on the category term | `N-2,10-K,8-K` |
| `DISCORD_BOT_TOKEN` | The required token needed to authenticate with Discord. This can be retrieved from the application dashboard

