/**
 * Message list component
 * Displays chat messages in a scrollable list
 */

import { useEffect, useRef } from 'react';

export default function MessageList({ messages, currentUser, typingUsers }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format timestamp for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      // Today - show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Other days - show date and time
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Group messages by date for date dividers
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ type: 'date', date: messageDate });
      }
      
      groups.push({ type: 'message', ...message });
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-4">
      {groupedMessages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        groupedMessages.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${index}`} className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-4 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-600 font-medium">
                  {new Date(item.date).toLocaleDateString([], { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            );
          }

          const message = item;
          const isOwnMessage = message.userId === currentUser.id;

          return (
            <div key={message.id} className="group">
              <div className="flex items-start space-x-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {message.user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {message.user.displayName}
                    </span>
                    {isOwnMessage && (
                      <span className="text-xs text-gray-500">(you)</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].displayName} is typing...`
              : `${typingUsers.map(u => u.displayName).join(', ')} are typing...`
            }
          </span>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
