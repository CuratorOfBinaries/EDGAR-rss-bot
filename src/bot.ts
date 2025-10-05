import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, Client, EmbedBuilder, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';

import FeedTracker from './feedTracker';
import config from './config/index';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const feedTracker = new FeedTracker(client, config.RSS_FEED_URLS!.split('|'));
const interval = config.CHECK_INTERVAL

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    feedTracker.startTracking(interval);
});

client.on('guildCreate', async (guild) => {
    console.log(`Joined a new guild: ${guild.name}`);

    const owner = await guild.fetchOwner();

    let retries = 0;
    const maxRetries = 10;
    
    while (!client.user && retries < maxRetries) {
        console.log(`Waiting for client to be ready... (attempt ${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        retries++;
    }

    if (!client.user) {
        console.error('Client user not available yet');
        return;
    }

    try {
        const configChannel = await guild.channels.create({
            name: '⚙️ EDGAR RSS Bot Config',
            type: ChannelType.GuildText,
            topic: 'Bot configuration - Admins only',
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.CreatePrivateThreads,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.UseExternalEmojis,
                        PermissionFlagsBits.UseExternalStickers,
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: guild.members.me!.id, // Bot permissions
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.UseExternalEmojis
                    ]
                },
                {
                    id: owner.id, // Guild owner
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ReadMessageHistory,
                    ]
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setDescription('Please select a channel for the EDGAR RSS feed updates to be posted')
            .setColor(0x5865F2);

        const select = new ChannelSelectMenuBuilder()
            .setCustomId('selectChannel')
            .setPlaceholder('Select a channel')
            .addChannelTypes(ChannelType.GuildText);

        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(select);

        await configChannel.send({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error('Failed to get bot integration:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChannelSelectMenu()) return;

    if (interaction.customId === 'selectChannel') {
        const selectedChannel = interaction.channels.first();

        if (!selectedChannel || selectedChannel.type !== ChannelType.GuildText) {
            await interaction.reply({ content: '❌ Please select a valid text channel.' });
            return;
        }

        feedTracker.addChannel({
            id: selectedChannel.id,
            name: selectedChannel.name,
            guildId: interaction.guildId!
        })

        console.log(`Configured channel ${selectedChannel.name} (${selectedChannel.id}) in guild ${interaction.guildId}`);

        await interaction.reply({
            content: `✅ Configuration complete! I'll post messages in ${selectedChannel}`,
        });
    }
});

client.login(config.DISCORD_BOT_TOKEN);