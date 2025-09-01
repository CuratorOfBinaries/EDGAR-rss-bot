# EDGAR RSS Monitor Discord Bot

This bot monitors the rss feeds of filings of companies on EDGAR

# How to Run

Firstly, ensure that environment variables are configured:

| Variable | Description | Example |
|----------|-------------|---------|
| `RSS_FEED_URLS` | The RSS feed you would like to monitor on EDGAR | `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=&company=&dateb=&owner=include&start=0&count=40&output=atom` |
| `CHECK_INTERVAL` | How often to monitor the feeds in milliseconds | `60000` |
| `MONITORED_FORMS` | Which filings to alert on based on the category term | `N-2,10-K,8-K` |
| `DISCORD_BOT_TOKEN` | The required token needed to authenticate with Discord. This can be retrieved from the application dashboard

