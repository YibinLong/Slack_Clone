/**
 * Message input component
 * Handles message composition and sending
 */

import { useState, useRef } from 'react';

export default function MessageInput({ value, onChange, onSend, placeholder = 'Type a message...' }) {
  const textareaRef = useRef(null);

  // Handle key press events
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send button click
  const handleSend = () => {
    if (value.trim()) {
      onSend();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Auto-resize textarea
  const handleChange = (e) => {
    const textarea = e.target;
    onChange(e.target.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight, with a max height
    const maxHeight = 120; // About 5 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <div className="relative">
      <div className="flex items-end space-x-3 bg-gray-50 border border-gray-300 rounded-lg p-3">
        {/* Message textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent border-none outline-none text-sm placeholder-gray-500 min-h-[24px] max-h-[120px]"
          rows={1}
          style={{ height: 'auto' }}
        />
        
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`flex-shrink-0 p-2 rounded-md transition-colors ${
            value.trim()
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title="Send message (Enter)"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            />
          </svg>
        </button>
      </div>
      
      {/* Help text */}
      <div className="mt-1 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
