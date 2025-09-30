/**
 * Chat area component
 * Shows messages and handles message input
 */

import { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatArea({
  channel,
  workspace,
  messages,
  user,
  typingUsers,
  onSendMessage,
  onStartTyping,
  onStopTyping
}) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicators
  const handleTyping = (text) => {
    setMessageText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      onStartTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onStopTyping();
      }
    }, 1000);
  };

  // Handle message submission
  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onStopTyping();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Stop typing when channel changes
  useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      onStopTyping();
    }
    setMessageText('');
  }, [channel?.id]);

  return (
    <div className="flex flex-col h-screen">
      {/* Channel Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              # {channel.name}
            </h2>
            {channel.description && (
              <p className="text-sm text-gray-600 mt-1">
                {channel.description}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {workspace.name}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          currentUser={user} 
          typingUsers={typingUsers}
        />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <MessageInput
          value={messageText}
          onChange={handleTyping}
          onSend={handleSendMessage}
          placeholder={`Message # ${channel.name}`}
        />
      </div>
    </div>
  );
}
