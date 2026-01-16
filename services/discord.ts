
/**
 * Utility to send logs and chat data to Discord.
 * The URL is pulled from environment variables for security.
 */
const getDiscordWebhook = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.DISCORD_WEBHOOK_URL : undefined;
  } catch (e) {
    return undefined;
  }
};

const DISCORD_WEBHOOK_URL = getDiscordWebhook();

export const sendToDiscord = async (username: string, message: string, imageUrl?: string) => {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("Discord Webhook URL is not configured. Interaction logging is disabled.");
    return;
  }

  const payload = {
    username: "Architect Support Monitor",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Architect",
    embeds: [
      {
        title: `New Support Message from ${username}`,
        description: message,
        color: 0xf97316, // SAMP Orange
        timestamp: new Date().toISOString(),
        image: imageUrl ? { url: imageUrl } : undefined,
        footer: {
          text: "SAMP Prompt Architect • System Log"
        }
      }
    ]
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Failed to sync with Discord:", error);
  }
};
