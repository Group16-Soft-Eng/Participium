import { Box, Typography, TextField, IconButton, Stack, Avatar, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useState, useEffect, useRef } from 'react';
import { getToken, getUserFromToken, getRoleFromToken } from '../../services/auth';

interface InternalChatSectionProps {
  reportId: number;
}

interface Message {
  id: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export function InternalChatSection({ reportId }: InternalChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get logged in user info
  const token = getToken();
  const currentUser = getUserFromToken(token);
  const currentRole = getRoleFromToken(token);
  const authorName = currentUser?.username || currentUser?.name || currentUser?.email || 'Unknown User';
  const authorRole = currentRole ? currentRole.replace(/_/g, ' ').toUpperCase() : 'Technical Office';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // TODO: Fetch messages from API
    // fetchInternalComments(reportId).then(setMessages);
  }, [reportId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setLoading(true);
      // TODO: Send message to API
      // await addInternalComment(reportId, newMessage);
      
      // Mock adding message
      const mockMessage: Message = {
        id: Date.now(),
        authorName: authorName,
        authorRole: authorRole,
        content: newMessage,
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, mockMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <LockIcon fontSize="small" color="warning" />
          <Typography variant="subtitle1" fontWeight={600}>
            Internal Communication
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Private conversation - not visible to citizens
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack spacing={2}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} formatTime={formatTime} />
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write an internal note..."
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={!newMessage.trim() || loading}
          >
            <SendIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Press Enter to send, Shift+Enter for new line
        </Typography>
      </Box>
    </>
  );
}

function EmptyState() {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      height="100%"
      color="text.secondary"
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
      <Typography variant="body2" fontWeight={500}>No messages yet</Typography>
      <Typography variant="caption">
        Start the conversation with your team
      </Typography>
    </Box>
  );
}

interface MessageBubbleProps {
  message: Message;
  formatTime: (date: string) => string;
}

function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    if (role.includes('technical')) return 'primary.main';
    if (role.includes('external')) return 'secondary.main';
    return 'grey.500';
  };

  return (
    <Box display="flex" gap={1.5}>
      <Avatar 
        sx={{ 
          width: 36, 
          height: 36,
          bgcolor: getRoleColor(message.authorRole),
          fontSize: '0.875rem'
        }}
      >
        {getInitials(message.authorName)}
      </Avatar>
      <Box flex={1}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="subtitle2" fontSize="0.875rem">
            {message.authorName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(message.createdAt)}
          </Typography>
        </Box>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 1.5, 
            bgcolor: 'grey.50',
            borderRadius: 2
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
