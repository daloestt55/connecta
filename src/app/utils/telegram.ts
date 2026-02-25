/**
 * Direct Telegram API integration for bug reports
 * 
 * WARNING: This exposes bot token in frontend code (encoded in bundle).
 * For production, use Supabase Edge Functions instead.
 * 
 * To use Edge Function instead:
 * 1. Deploy: supabase functions deploy bug-report
 * 2. Set env vars in Supabase Dashboard
 * 3. Use supabase.functions.invoke("bug-report")
 */

interface BugReportData {
  title: string;
  description: string;
  category: string;
  username?: string;
  email?: string;
  userId?: string;
  pageUrl?: string;
  userAgent?: string;
}

/**
 * Send bug report directly to Telegram
 */
export async function sendBugReportToTelegram(data: BugReportData): Promise<{ success: boolean; error?: string }> {
  // @ts-ignore - Vite env variables
  const botToken = import.meta.env?.VITE_TELEGRAM_BUG_BOT_TOKEN;
  // @ts-ignore - Vite env variables
  const chatId = import.meta.env?.VITE_TELEGRAM_BUG_CHAT_ID;

  // If no credentials, fail silently (will be caught by caller)
  if (!botToken || !chatId) {
    console.warn('Telegram bot credentials not configured');
    return { 
      success: false, 
      error: 'Telegram bot not configured. Set VITE_TELEGRAM_BUG_BOT_TOKEN and VITE_TELEGRAM_BUG_CHAT_ID in .env' 
    };
  }

  try {
    const message = [
      '🐛 <b>Connecta Bug Report</b>',
      '',
      `📋 <b>Category:</b> ${escapeHtml(data.category)}`,
      `📝 <b>Title:</b> ${escapeHtml(data.title)}`,
      `💬 <b>Description:</b> ${escapeHtml(data.description)}`,
      '',
      `👤 <b>User:</b> ${escapeHtml(data.username || 'Unknown')}`,
      `📧 <b>Email:</b> ${escapeHtml(data.email || 'Unknown')}`,
      `🆔 <b>User ID:</b> ${escapeHtml(data.userId || 'Unknown')}`,
      `🔗 <b>Page:</b> ${escapeHtml(data.pageUrl || 'Unknown')}`,
      `🖥️ <b>Agent:</b> ${escapeHtml(data.userAgent?.substring(0, 100) || 'Unknown')}`,
      `⏰ <b>Time:</b> ${new Date().toISOString()}`,
    ].join('\n');

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error('Telegram API error:', result);
      return {
        success: false,
        error: result.description || 'Failed to send to Telegram',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending to Telegram:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Escape HTML special characters for Telegram HTML parse mode
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
