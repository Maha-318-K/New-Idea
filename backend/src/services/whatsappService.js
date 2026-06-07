const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const issuesModel = require('../models/issuesModel');
const aiExtractionService = require('./aiExtractionService');
const ocrService = require('./ocrService');
const configModel = require('../models/whatsappConfigModel');

const logToFile = (message) => {
  try {
    const logPath = path.join(process.cwd(), 'whatsapp-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {}
};

let client;
let currentQrCode = null;
let connectionStatus = 'Disconnected';
let monitoredGroups = configModel.getConfig().monitoredGroups || []; // Array of group IDs to monitor
const serverStartTime = Math.floor(Date.now() / 1000);
let healthMonitorInterval = null;

const addAuditLog = (action, user = 'System') => {
  const config = configModel.getConfig();
  const logs = config.auditLogs || [];
  logs.push({ date: new Date().toISOString(), action, user });
  configModel.saveConfig({ auditLogs: logs });
};

const initializeWhatsApp = () => {
  if (client) {
    try {
      client.destroy();
    } catch (e) {}
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('QR Code generated');
    currentQrCode = qr;
    connectionStatus = 'Disconnected';
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    connectionStatus = 'Connected';
    currentQrCode = null;
    
    const config = configModel.getConfig();
    if (!config.connectedDeviceId) {
      const newDeviceId = `device_${Date.now()}`;
      configModel.saveConfig({ connectedDeviceId: newDeviceId });
      addAuditLog(`WhatsApp Connected. New Device ID: ${newDeviceId}`);
    }
    
    // Health monitor
    if (healthMonitorInterval) clearInterval(healthMonitorInterval);
    healthMonitorInterval = setInterval(async () => {
      try {
        const state = await client.getState();
        if (state === 'CONNECTED') {
          configModel.saveConfig({ lastSyncTime: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Health monitor error:', err);
      }
    }, 60000); // Check every minute
  });

  client.on('disconnected', async (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    connectionStatus = 'Disconnected';
    if (healthMonitorInterval) clearInterval(healthMonitorInterval);
    try {
      await client.destroy();
    } catch (e) {}
    
    // Auto reconnect by completely reinitializing the client
    setTimeout(() => {
      connectionStatus = 'Reconnecting';
      initializeWhatsApp();
    }, 5000);
  });

  client.on('message_create', async (message) => {
    const logMsg = `Received message from ${message.from}. Body: "${message.body}". Timestamp: ${message.timestamp}`;
    console.log(`[WhatsApp] ${logMsg}`);
    logToFile(logMsg);
    
    // Server start time check removed to prevent clock-drift issues.
    // Duplicate messages are handled below via processedMessageIds.
    
    // Only process if it's from a monitored group
    const chat = await message.getChat();
    console.log(`[WhatsApp] Chat ID: ${chat.id._serialized}, isGroup: ${chat.isGroup}`);
    
    if (!chat.isGroup || !monitoredGroups.includes(chat.id._serialized)) {
      console.log(`[WhatsApp] Ignored: Not a monitored group (isGroup: ${chat.isGroup}, Monitored: ${monitoredGroups.includes(chat.id._serialized)})`);
      return;
    }

    const config = configModel.getConfig();
    if (config.processedMessageIds && config.processedMessageIds.includes(message.id._serialized)) {
      return; // Prevent duplicates
    }

    try {
      await processMessage(message, chat);
    } catch (error) {
      const errMsg = `Error processing WhatsApp message: ${error.message}\nStack: ${error.stack}`;
      console.error(errMsg);
      logToFile(errMsg);
    }
  });

  client.initialize().catch(err => {
    console.error('Error initializing WhatsApp client:', err);
    setTimeout(() => {
      initializeWhatsApp();
    }, 5000);
  });
};

const processMessage = async (message, chat) => {
  const senderContact = await message.getContact();
  const senderName = senderContact.pushname || senderContact.name || senderContact.number;
  
  let messageText = message.body || '';
  let attachments = [];
  let ocrText = '';

  // Handle Media
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    if (media) {
      const extension = media.mimetype.split('/')[1].split(';')[0];
      const filename = `wa_${Date.now()}.${extension}`;
      
      let folder = 'documents';
      let type = 'document';

      if (media.mimetype.startsWith('image/')) {
        folder = 'images';
        type = 'image';
      } else if (media.mimetype.startsWith('video/')) {
        folder = 'videos';
        type = 'video';
      }

      const savePath = path.join(__dirname, `../../uploads/production-issues/${folder}`, filename);
      fs.writeFileSync(savePath, media.data, 'base64');
      
      attachments.push({ type, name: filename, url: `/uploads/production-issues/${folder}/${filename}` });

      // If it's an image, run OCR
      if (type === 'image') {
        const text = await ocrService.extractTextFromImage(savePath);
        if (text) {
          ocrText = `\n[OCR Text from Image]: ${text}`;
        }
      }
    }
  }

  try {
    const fullTextToAnalyze = `${messageText} ${ocrText}`.trim();
    if (!fullTextToAnalyze && attachments.length === 0) return;

    // AI Extraction
    const extracted = aiExtractionService.extractIssueDetails(fullTextToAnalyze || 'Media upload without text');

    // Duplicate Detection
    const openIssues = issuesModel.getAllIssues().filter(i => i.status !== 'Closed' && i.status !== 'Resolved');
    
    // Simple heuristic: if the pageName matches and title is very similar (or same keywords)
    const existingIssue = openIssues.find(i => 
      i.pageName === extracted.pageName && 
      (i.issue.toLowerCase().includes(extracted.title.toLowerCase()) || 
       extracted.title.toLowerCase().includes(i.issue.toLowerCase().substring(0, 20)))
    );

    if (existingIssue) {
      // Add attachment to existing issue, increase occurrence count, add activity log
      const updatedData = {
        attachments: [...(existingIssue.attachments || []), ...attachments],
        duplicateCount: (existingIssue.duplicateCount || 0) + 1,
        historyEntry: {
          date: new Date().toLocaleString('en-GB'),
          action: `Duplicate issue detected from WhatsApp. Message from ${senderName}.`,
          user: 'System'
        }
      };
      issuesModel.updateIssue(existingIssue.id, updatedData);
      const msg = `Duplicate detected for issue ${existingIssue.id}`;
      console.log(msg);
      logToFile(msg);
    } else {
      // Create new issue
      const newIssueData = {
        pageName: extracted.pageName,
        issue: `${extracted.title}\n\n${extracted.description}`,
        priority: extracted.priority,
        raisedBy: senderName,
        raisedSrc: 'via WhatsApp',
        attachments: attachments,
        status: 'Open'
      };
      const created = issuesModel.createIssue(newIssueData);
      
      // Add initial log
      issuesModel.updateIssue(created.id, {
        historyEntry: {
          date: new Date().toLocaleString('en-GB'),
          action: `Issue created via WhatsApp message from ${senderName}.`,
          user: 'System'
        }
      });
      const msg = `New WhatsApp issue created: ${created.id}`;
      console.log(msg);
      logToFile(msg);
    }

    // Update persistent config
    const config = configModel.getConfig();
    const newProcessedIds = [...(config.processedMessageIds || []), message.id._serialized];
    configModel.saveConfig({
      lastProcessedMessageTime: new Date().toISOString(),
      processedMessageIds: newProcessedIds
    });
  } catch (err) {
    const errMsg = `Error in processing message details: ${err.message}\nStack: ${err.stack}`;
    console.error(errMsg);
    logToFile(errMsg);
  }
};

const getStatus = () => {
  const config = configModel.getConfig();
  return {
    status: connectionStatus,
    qrCode: currentQrCode,
    monitoredGroups,
    lastSyncTime: config.lastSyncTime,
    lastProcessedMessageTime: config.lastProcessedMessageTime,
    issueDefaultGroup: config.issueDefaultGroup,
    connectedDeviceId: config.connectedDeviceId,
    lastMessageSent: config.lastMessageSent,
    messagesSentCount: config.messagesSentCount,
    auditLogs: config.auditLogs || []
  };
};

const setGroups = (groups) => {
  monitoredGroups = groups;
  configModel.saveConfig({ monitoredGroups: groups });
};

const setIssueDefaultGroup = (groupId) => {
  configModel.saveConfig({ issueDefaultGroup: groupId });
  addAuditLog(`Issue Default Group configured to: ${groupId || 'None'}`);
};

const sendIssueToGroup = async (payload, user) => {
  const config = configModel.getConfig();
  if (!config.issueDefaultGroup) throw new Error("No default issue group selected.");
  if (connectionStatus !== 'Connected' || !client) throw new Error("WhatsApp is not connected.");
  
  const { pageName, issueDetails, attachments } = payload;
  const caption = `🚨 *New QA Issue*\n\n*Page:* ${pageName || 'Unknown'}\n\n*Details:*\n${issueDetails || 'No details provided.'}`;
  
  try {
    if (attachments && attachments.length > 0) {
      let firstMediaSent = false;
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (att.url && att.url.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), att.url);
          if (fs.existsSync(filePath)) {
            const media = MessageMedia.fromFilePath(filePath);
            if (!firstMediaSent) {
              await client.sendMessage(config.issueDefaultGroup, media, { caption });
              firstMediaSent = true;
            } else {
              await client.sendMessage(config.issueDefaultGroup, media);
            }
          }
        }
      }
      if (!firstMediaSent) {
         await client.sendMessage(config.issueDefaultGroup, caption);
      }
    } else {
      await client.sendMessage(config.issueDefaultGroup, caption);
    }
    
    const currentCount = config.messagesSentCount || 0;
    configModel.saveConfig({ 
      lastMessageSent: new Date().toISOString(),
      messagesSentCount: currentCount + 1
    });
    
    addAuditLog(`Issue created and sent to group ${config.issueDefaultGroup}: ${pageName}`, user);
    return { success: true };
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
    throw new Error("Failed to send WhatsApp message");
  }
};

const sendDocumentMessage = async (payload, user) => {
  const config = configModel.getConfig();
  if (connectionStatus !== 'Connected' || !client) throw new Error("WhatsApp is not connected.");
  
  const { chatId, documentName, documentType, generatedDate, attachmentUrl } = payload;
  if (!chatId) throw new Error("No destination chat provided.");
  
  const caption = `📄 *New Document Generated*\n\n*Name:* ${documentName || 'Untitled'}\n*Type:* ${documentType || 'Custom Report'}\n*Generated:* ${generatedDate || 'Recently'}\n\n_Please check the portal for details._`;
  
  try {
    if (attachmentUrl && attachmentUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), attachmentUrl);
      if (fs.existsSync(filePath)) {
        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(chatId, media, { caption });
      } else {
        await client.sendMessage(chatId, caption);
      }
    } else {
      await client.sendMessage(chatId, caption);
    }
    
    const currentCount = config.messagesSentCount || 0;
    configModel.saveConfig({ 
      lastMessageSent: new Date().toISOString(),
      messagesSentCount: currentCount + 1
    });
    
    addAuditLog(`Document '${documentName}' sent to chat ${chatId}`, user);
    return { success: true };
  } catch (err) {
    console.error("Error sending document message:", err);
    throw new Error("Failed to send WhatsApp message");
  }
};

// Async method to fetch all groups and contacts the bot is part of
const getAvailableChats = async () => {
  if (connectionStatus !== 'Connected') return [];
  const chats = await client.getChats();
  return chats.map(c => ({
    id: c.id._serialized,
    name: c.name || c.id.user || 'Unknown'
  }));
};

const disconnectWhatsApp = async () => {
  console.log('Disconnecting WhatsApp...');
  if (client) {
    try {
      await client.destroy();
      // Give Puppeteer an extra second to fully close chrome processes
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.error('Error destroying client:', e);
    }
  }
  
  connectionStatus = 'Disconnected';
  currentQrCode = null;
  
  addAuditLog('WhatsApp Disconnected manually');
  
  // Clear processed message cache to allow receiving messages again on new connection
  configModel.saveConfig({ processedMessageIds: [], monitoredGroups: [], connectedDeviceId: null, issueDefaultGroup: null });
  monitoredGroups = [];
  
  // Clean up session folder with retry logic
  const sessionPath = path.join(process.cwd(), 'whatsapp-session');
  if (fs.existsSync(sessionPath)) {
    let retries = 5;
    while (retries > 0) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('Cleared whatsapp-session folder successfully.');
        break;
      } catch(err) {
        if (retries === 1) {
          console.error('Failed to clear session folder after multiple attempts:', err);
        } else {
          console.log(`Failed to clear session folder, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retry
        }
        retries--;
      }
    }
  }

  // Reinitialize to trigger QR code generation again
  setTimeout(() => {
    initializeWhatsApp();
  }, 2000);

  return { success: true };
};

module.exports = {
  initializeWhatsApp,
  getStatus,
  setGroups,
  setIssueDefaultGroup,
  sendIssueToGroup,
  sendDocumentMessage,
  getAvailableChats,
  disconnectWhatsApp
};
