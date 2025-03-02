
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useMessageState } from '../use-message-state';
import { Message } from '@/components/chat/types';

describe('useMessageState', () => {
  let result: any;
  
  beforeEach(() => {
    result = renderHook(() => useMessageState()).result;
  });

  it('should initialize with empty message and messages array', () => {
    expect(result.current.message).toBe('');
    expect(result.current.messages).toEqual([]);
  });

  it('should add user message to messages array', () => {
    act(() => {
      result.current.addUserMessage('Hello AI');
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual({
      content: 'Hello AI',
      isUser: true
    });
  });

  it('should add AI message to messages array', () => {
    act(() => {
      result.current.addAIMessage('Hello human');
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual({
      content: 'Hello human',
      isUser: false
    });
  });

  it('should add loading message', () => {
    act(() => {
      result.current.addLoadingMessage();
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual({
      content: '...',
      isUser: false
    });
  });

  it('should remove the last message', () => {
    act(() => {
      result.current.addUserMessage('Hello AI');
      result.current.addAIMessage('Hello human');
      result.current.removeLastMessage();
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello AI');
  });

  it('should reset all messages', () => {
    act(() => {
      result.current.addUserMessage('Hello AI');
      result.current.addAIMessage('Hello human');
      result.current.resetMessages();
    });
    
    expect(result.current.messages).toHaveLength(0);
  });

  it('should replace messages with setMessages', () => {
    const newMessages: Message[] = [
      { content: 'Message 1', isUser: true },
      { content: 'Message 2', isUser: false }
    ];
    
    act(() => {
      result.current.setMessages(newMessages);
    });
    
    expect(result.current.messages).toEqual(newMessages);
  });

  it('should update message with setMessage', () => {
    act(() => {
      result.current.setMessage('New message');
    });
    
    expect(result.current.message).toBe('New message');
  });
});
