import React, {useEffect, useState, useCallback} from 'react';

const DAILY_TOKEN_LIMIT = 200;
const MAX_INPUT_TOKENS = 100;
const MAX_OUTPUT_TOKENS = 150;

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4); // rough estimate
}

function storageKeys(productId) {
  const base = productId || 'global';
  return {
    chat: `aiChat_${base}`,
    tokens: 'aiChatTokens_global', // Global token limit across all products
  };
}

const ProductFAQ = React.forwardRef(({productId, hideLauncher = false}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextError, setContextError] = useState('');
  const [productContext, setProductContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyTokensUsed, setDailyTokensUsed] = useState(0);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);

  const {chat: chatKey, tokens: tokenKey} = storageKeys(productId);

  const fetchContext = useCallback(async () => {
    if (!productId || contextLoaded || productContext) return;
    setContextError('');
    try {
      const res = await fetch(`/api/product-context?productId=${encodeURIComponent(productId)}`);
      if (!res.ok) {
        setContextError('Unable to load product context.');
        return;
      }
      const data = await res.json();
      if (data?.description) {
        setProductContext(data);
        setContextLoaded(true);
      } else {
        setContextError('Product details unavailable.');
      }
    } catch (err) {
      console.error('Context fetch failed', err);
      setContextError('Unable to load product context.');
    }
  }, [productContext, contextLoaded, productId]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    fetchContext();
  }, [fetchContext]);

  // Expose openChat function to parent via ref
  React.useImperativeHandle(ref, () => ({
    openChat,
  }), [openChat]);

  // Load persisted chat (per product) and token usage (global)
  useEffect(() => {
    if (!productId) {
      setMessages([]);
      return;
    }
    
    try {
      // Load chat history for this specific product
      const saved = localStorage.getItem(chatKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } else {
        // Clear messages if no saved chat for this product
        setMessages([]);
      }
      // Load global token usage (shared across all products)
      const tokenData = localStorage.getItem(tokenKey);
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        const today = new Date().toDateString();
        if (parsed.date === today && typeof parsed.used === 'number') {
          setDailyTokensUsed(parsed.used);
        } else {
          // Reset if it's a new day
          setDailyTokensUsed(0);
        }
      } else {
        setDailyTokensUsed(0);
      }
    } catch (err) {
      console.error('Failed to read chat history', err);
      setMessages([]);
      setDailyTokensUsed(0);
    }
  }, [productId, chatKey, tokenKey]);

  // Persist chat and token usage
  useEffect(() => {
    if (!productId || messages.length === 0) return;
    
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to persist chat history', err);
    }
  }, [messages, chatKey, productId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && isOpen) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }, [messages, loading, isOpen]);

  const persistTokenUsage = useCallback(
    (nextUsage) => {
      const today = new Date().toDateString();
      setDailyTokensUsed(nextUsage);
      try {
        localStorage.setItem(tokenKey, JSON.stringify({date: today, used: nextUsage}));
      } catch (err) {
        console.error('Failed to persist token usage', err);
      }
    },
    [tokenKey],
  );

  const closeChat = () => {
    setIsOpen(false);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!productId) {
      setError('Missing product.');
      return;
    }
    if (!productContext) {
      setError('Loading product info, try again.');
      fetchContext();
      return;
    }

    const inputTokens = estimateTokens(input);
    
    // Check if message is too long
    if (inputTokens > MAX_INPUT_TOKENS) {
      // Send a special message to the API to have the LLM respond that the message is too long
      const newMessages = [...messages, {role: 'user', content: input.trim()}];
      setMessages(newMessages);
      setInput('');
      setLoading(true);
      setError('');

      try {
      // Get current page URL for WhatsApp link
      const productUrl = window.location.href;
      
      const res = await fetch('/api/ai-answer-faq', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          productId,
          messages: newMessages,
          context: productContext,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          messageTooLong: true,
          productUrl,
        }),
      });

        const data = await res.json();
        if (!res.ok || !data?.answer) {
          setError(data?.error || 'Could not get a response.');
          return;
        }

        const assistantMessage = {
          role: 'assistant',
          content: data.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error('Chat send failed', err);
        setError('Something went wrong. Try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const todayUsage = dailyTokensUsed + inputTokens;
    if (todayUsage > DAILY_TOKEN_LIMIT) {
      setError('Daily limit reached.');
      return;
    }

    const newMessages = [...messages, {role: 'user', content: input.trim()}];
    setMessages(newMessages);
    setInput('');
    persistTokenUsage(todayUsage);
    setLoading(true);
    setError('');

    try {
      // Get current page URL for WhatsApp link
      const productUrl = window.location.href;
      
      const res = await fetch('/api/ai-answer-faq', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          productId,
          messages: newMessages,
          context: productContext,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          productUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.answer) {
        setError(data?.error || 'Could not get a response.');
        return;
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat send failed', err);
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!productId) return null;

  return (
    <>
      {!hideLauncher && (
        <div className="ai-summary product-chat-launcher">
          <div className="ai-summary__header">
            <div className="ai-summary__badge">
              <span className="ai-summary__title">Ask AI</span>
              <span className="ai-summary__dot" aria-hidden="true" />
            </div>
            <button type="button" className="ai-summary__action" onClick={openChat}>
              Ask about this product
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="ai-modal-overlay product-chat-overlay" onClick={closeChat}>
          <div className="ai-modal product-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal__header product-chat-modal__header">
              <div className="ai-modal__left">
                <span className="ai-modal__chip">Ask AI</span>
                <span className="ai-modal__status">
                  {contextError
                    ? 'No context'
                    : !contextLoaded
                    ? 'Loading'
                    : loading
                    ? 'Thinking'
                    : 'Ready'}
                </span>
              </div>
              <button
                type="button"
                className="ai-modal__close"
                onClick={closeChat}
                aria-label="Close Ask AI"
              >
                ✕
              </button>
            </div>

            <div className="product-chat-body">
              <div className="product-chat-messages" ref={messagesContainerRef} aria-live="polite">
                {messages.length === 0 && (
                  <div className="product-chat-empty">
                    <p>Ask Any question about this product.</p>
                    {contextError && <p className="product-chat-error">{contextError}</p>}
                  </div>
                )}
                {messages.map((msg, idx) => {
                  // Parse markdown-style links [text](url) and convert to clickable links
                  // Also handle plain WhatsApp URLs that might appear as text
                  const parseLinks = (text) => {
                    if (!text) return [text];
                    
                    const parts = [];
                    let lastIndex = 0;
                    const matches = [];
                    
                    // First, find all markdown links [text](url)
                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    let match;
                    while ((match = markdownLinkRegex.exec(text)) !== null) {
                      matches.push({
                        index: match.index,
                        length: match[0].length,
                        text: match[1],
                        url: match[2],
                        type: 'markdown'
                      });
                    }
                    
                    // Also find plain WhatsApp URLs that might appear as text
                    const whatsappUrlRegex = /https?:\/\/wa\.me\/[^\s\)]+/g;
                    while ((match = whatsappUrlRegex.exec(text)) !== null) {
                      // Only add if not already in a markdown link
                      const isInMarkdown = matches.some(m => 
                        match.index >= m.index && match.index < m.index + m.length
                      );
                      if (!isInMarkdown) {
                        matches.push({
                          index: match.index,
                          length: match[0].length,
                          text: 'WhatsApp',
                          url: match[0],
                          type: 'url'
                        });
                      }
                    }
                    
                    // Sort matches by index
                    matches.sort((a, b) => a.index - b.index);
                    
                    // Build parts array
                    matches.forEach((match) => {
                      // Add text before the link
                      if (match.index > lastIndex) {
                        parts.push(text.slice(lastIndex, match.index));
                      }
                      // Add the link
                      parts.push(
                        <a
                          key={match.index}
                          href={match.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'rgba(0, 214, 255, 0.9)',
                            textDecoration: 'underline',
                            fontWeight: 600,
                          }}
                        >
                          {match.text}
                        </a>
                      );
                      lastIndex = match.index + match.length;
                    });
                    
                    // Add remaining text
                    if (lastIndex < text.length) {
                      parts.push(text.slice(lastIndex));
                    }
                    
                    return parts.length > 0 ? parts : [text];
                  };
                  
                  return (
                    <div key={idx} className={`product-chat-bubble ${msg.role}`}>
                      <span className="product-chat-role">{msg.role === 'assistant' ? 'AI' : 'You'}</span>
                      <p>{parseLinks(msg.content)}</p>
                    </div>
                  );
                })}
                {loading && (
                  <div className="product-chat-bubble assistant">
                    <span className="product-chat-role">AI</span>
                    <p>Thinking...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="product-chat-input" onSubmit={handleSend}>
                <div className="product-chat-input-row">
                  <textarea
                    rows={3}
                    placeholder="Type your question here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || !!contextError}
                    maxLength={1200}
                  />
                  <button type="submit" disabled={loading || !input.trim() || !!contextError}>
                    {loading ? 'Sending…' : 'Send'}
                  </button>
                </div>
                {error && <p className="product-chat-error">{error}</p>}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ProductFAQ.displayName = 'ProductFAQ';

export default ProductFAQ;
