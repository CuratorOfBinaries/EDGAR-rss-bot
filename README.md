# EDGAR RSS Monitor Discord Bot

This bot monitors the rss feeds of filings of companies on EDGAR

# How to Run

Firstly, ensure that environment variables are configured:

`RSS_FEED_URLS` - The RSS feed you would like to monitor on EDGAR
`CHECK_INTERVAL` - How often to monitor the feeds in miliseconds
`MONITORED_FORMS` - Which filings to alert on based on the category term ex. `N-2`, `10-K`, and etc...
`DISCORD_BOT_TOKEN` - The required token needed to authenticate with Discord. This can be retrieved from the application dashboard

