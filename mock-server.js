import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 54321;

app.use(cors());
app.use(express.json());

// Mock Telegram code sending
app.post('/functions/v1/send-telegram-code', (req, res) => {
  const { chatId, code } = req.body;
  
  console.log(`📱 Mock Telegram: Sending code ${code} to chat ${chatId}`);
  
  // Simulate successful send
  res.json({ 
    success: true, 
    message: 'Code sent via Telegram (MOCK)' 
  });
});

// Mock 2FA endpoints
app.post('/functions/v1/twofa', (req, res) => {
  const { action, code } = req.body;
  
  console.log(`🔐 Mock 2FA: Action=${action}, Code=${code || 'N/A'}`);
  
  switch (action) {
    case 'status':
      // Return 2FA disabled by default for mock
      res.json({ enabled: false });
      break;
      
    case 'setup':
      res.json({ 
        secret: 'MOCK_SECRET_KEY_123456',
        otpauthUrl: 'otpauth://totp/Connecta:mock@user.com?secret=MOCK_SECRET_KEY_123456&issuer=Connecta'
      });
      break;
      
    case 'confirm':
      // Accept any 6-digit code in mock mode
      if (code && code.length === 6) {
        res.json({ enabled: true });
      } else {
        res.status(400).json({ error: 'Invalid verification code' });
      }
      break;
      
    case 'verify':
      // Accept any 6-digit code in mock mode
      if (code && code.length === 6) {
        res.json({ verified: true });
      } else {
        res.status(400).json({ error: 'Invalid code' });
      }
      break;
      
    case 'disable':
      res.json({ enabled: false });
      break;
      
    default:
      res.status(400).json({ error: 'Unknown action' });
  }
});

// Mock Bug Report endpoint with real Telegram integration (if configured)
app.post('/functions/v1/bug-report', async (req, res) => {
  const { title, description, category, username, email, userId, pageUrl, userAgent } = req.body;
  
  console.log(`🐛 Bug Report Received:`);
  console.log(`   Category: ${category}`);
  console.log(`   Title: ${title}`);
  console.log(`   User: ${username || email || 'Anonymous'}`);
  console.log(`   Description: ${description.substring(0, 100)}...`);
  
  // Check if Telegram is configured via environment variables
  const telegramBotToken = process.env.TELEGRAM_BUG_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_BUG_CHAT_ID;
  
  if (telegramBotToken && telegramChatId) {
    try {
      const message = [
        '🐛 Connecta Bug Report',
        '',
        `📋 Category: ${category}`,
        `📝 Title: ${title}`,
        `💬 Description: ${description}`,
        '',
        `👤 User: ${username || 'Unknown'}`,
        `📧 Email: ${email || 'Unknown'}`,
        `🆔 User ID: ${userId || 'Unknown'}`,
        `🔗 Page: ${pageUrl || 'Unknown'}`,
        `🖥️ Agent: ${userAgent || 'Unknown'}`,
        `⏰ Time: ${new Date().toISOString()}`,
      ].join('\n');
      
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );
      
      const result = await telegramResponse.json();
      
      if (result.ok) {
        console.log(`✅ Bug report sent to Telegram successfully!`);
        res.json({ success: true, message: 'Bug report sent to Telegram' });
      } else {
        console.error(`❌ Telegram API error:`, result);
        res.status(500).json({ error: 'Failed to send to Telegram', details: result });
      }
    } catch (error) {
      console.error(`❌ Error sending to Telegram:`, error.message);
      res.status(500).json({ error: 'Failed to send bug report', details: error.message });
    }
  } else {
    console.log(`⚠️  Telegram not configured. Set TELEGRAM_BUG_BOT_TOKEN and TELEGRAM_BUG_CHAT_ID in .env`);
    res.json({ 
      success: true, 
      message: 'Bug report received (mock mode - Telegram not configured)' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Supabase Edge Functions running on http://localhost:${PORT}`);
  console.log(`📱 Telegram endpoint: http://localhost:${PORT}/functions/v1/send-telegram-code`);
  console.log(`🔐 2FA endpoint: http://localhost:${PORT}/functions/v1/twofa`);
  console.log(`🐛 Bug Report endpoint: http://localhost:${PORT}/functions/v1/bug-report`);
  console.log('\n⚠️  MOCK MODE: All requests will succeed without actual Telegram/2FA');
  console.log('💡 To enable real Telegram bug reports, set TELEGRAM_BUG_BOT_TOKEN and TELEGRAM_BUG_CHAT_ID in .env\n');
});
