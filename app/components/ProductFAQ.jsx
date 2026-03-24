import React, {useEffect, useState, useCallback} from 'react';

const DAILY_TOKEN_LIMIT = 100;
const MAX_INPUT_TOKENS = 50;
const MAX_OUTPUT_TOKENS = 200;
const STARTER_PROMPTS = [
  {
    label: 'Specs',
    question: 'What are the main specs of this product?',
  },
  {
    label: 'Warranty',
    question: 'What warranty comes with this product?',
  },
  {
    label: 'Delivery',
    question: 'How long does delivery take for this product?',
  },
  {
    label: 'Compatibility',
    question: 'Is this product compatible with my setup?',
  },
];

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

const ProductFAQ = React.forwardRef(
  ({productId, hideLauncher = false}, ref) => {
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
    const inputRef = React.useRef(null);

    const {chat: chatKey, tokens: tokenKey} = storageKeys(productId);
    const statusLabel = contextError
      ? 'No context'
      : !contextLoaded
      ? 'Loading'
      : loading
      ? 'Thinking'
      : 'Ready';
    const statusTone = contextError
      ? 'error'
      : !contextLoaded
      ? 'loading'
      : loading
      ? 'thinking'
      : 'ready';
    const focusInput = useCallback((cursorPosition) => {
      if (!inputRef.current) return;
      inputRef.current.focus({preventScroll: true});
      if (
        typeof cursorPosition === 'number' &&
        typeof inputRef.current.setSelectionRange === 'function'
      ) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, []);

    const fetchContext = useCallback(async () => {
      if (!productId) return null;
      if (contextLoaded && productContext) return productContext;
      setContextError('');
      try {
        const res = await fetch(
          `/api/product-context?productId=${encodeURIComponent(productId)}`,
        );
        if (!res.ok) {
          setContextError('Unable to load product context.');
          return null;
        }
        const data = await res.json();
        if (data?.description) {
          setProductContext(data);
          setContextLoaded(true);
          return data;
        } else {
          setContextError('Product details unavailable.');
          return null;
        }
      } catch (err) {
        console.error('Context fetch failed', err);
        setContextError('Unable to load product context.');
        return null;
      }
    }, [productContext, contextLoaded, productId]);

    const openChat = useCallback(() => {
      setIsOpen(true);
      fetchContext();
    }, [fetchContext]);

    // Expose openChat function to parent via ref
    React.useImperativeHandle(
      ref,
      () => ({
        openChat,
      }),
      [openChat],
    );

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
          localStorage.setItem(
            tokenKey,
            JSON.stringify({date: today, used: nextUsage}),
          );
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

    const sendMessage = useCallback(
      async (messageText) => {
        const message = String(messageText || '').trim();
        if (!message) return;

        if (loading) return;

        setError('');

        if (input) {
          setInput('');
        }

        const restoreMessageToInput = () => {
          setInput(message);
          if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
              focusInput(message.length);
            });
          }
        };

        const productUrl = window.location.href;

        if (!productId) {
          setError('Missing product.');
          restoreMessageToInput();
          return;
        }

        let nextContext = productContext;
        if (!nextContext) {
          nextContext = await fetchContext();
        }
        if (!nextContext) {
          setError('Loading product info, try again.');
          restoreMessageToInput();
          return;
        }

        const inputTokens = estimateTokens(message);

        // Check if message is too long
        if (inputTokens > MAX_INPUT_TOKENS) {
          const newMessages = [...messages, {role: 'user', content: message}];
          setMessages(newMessages);
          setLoading(true);

          try {
            const res = await fetch('/api/ai-answer-faq', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                productId,
                messages: newMessages,
                context: nextContext,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                messageTooLong: true,
                productUrl,
                inputTokens,
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
            focusInput();
          }
          return;
        }

        // Client-side check (server will enforce the real limit)
        const todayUsage = dailyTokensUsed + inputTokens;
        if (todayUsage > DAILY_TOKEN_LIMIT) {
          setError('Daily limit reached. Please try again tomorrow.');
          restoreMessageToInput();
          return;
        }

        const newMessages = [...messages, {role: 'user', content: message}];
        setMessages(newMessages);
        persistTokenUsage(todayUsage);
        setLoading(true);

        try {
          const res = await fetch('/api/ai-answer-faq', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              productId,
              messages: newMessages,
              context: nextContext,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              productUrl,
              inputTokens,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            if (data?.limitReached) {
              setError('Daily limit reached. Please try again tomorrow.');
            } else {
              setError(data?.error || 'Could not get a response.');
            }
            return;
          }
          if (!data?.answer) {
            setError('Could not get a response.');
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
          focusInput();
        }
      },
      [
        dailyTokensUsed,
        fetchContext,
        focusInput,
        input,
        loading,
        messages,
        persistTokenUsage,
        productContext,
        productId,
      ],
    );

    const handleSend = async (e) => {
      e.preventDefault();
      await sendMessage(input);
    };

    const handleStarterPrompt = useCallback(
      (question) => {
        void sendMessage(question);
      },
      [sendMessage],
    );

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(e);
      }
    };

    const handleClearChat = () => {
      setMessages([]);
      setInput('');
      setError('');
      try {
        localStorage.removeItem(chatKey);
      } catch (err) {
        console.error('Failed to clear chat history', err);
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
              <button
                type="button"
                className="ai-summary__action"
                onClick={openChat}
              >
                Ask about this product
              </button>
            </div>
          </div>
        )}

        {isOpen && (
          <div
            className="ai-modal-overlay product-chat-overlay"
            onClick={closeChat}
          >
            <div
              className="ai-modal product-chat-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-chat-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ai-modal__header product-chat-modal__header">
                <div className="product-chat-modal__titleblock">
                  <div className="ai-modal__left">
                    <span className="ai-modal__chip">Ask AI</span>
                    <span
                      className={`ai-modal__status product-chat-status product-chat-status--${statusTone}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <h2 id="product-chat-title" className="product-chat-modal__title">
                    Product assistant
                  </h2>
                  <p className="product-chat-modal__subtitle">
                    Ask about specs, warranty, delivery, or compatibility.
                  </p>
                </div>
                <div className="ai-modal__actions product-chat-modal__actions">
                  <button
                    type="button"
                    className="ai-modal__clear"
                    onClick={handleClearChat}
                    disabled={loading || messages.length === 0}
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="ai-modal__close"
                    onClick={closeChat}
                    aria-label="Close Ask AI"
                  >
                    ✕
                  </button>
                </div>
                <span className="ai-modal__disclaimer product-chat-modal__disclaimer">
                  AI can make mistakes. Always confirm details with a support
                  agent.
                </span>
              </div>

              <div className="product-chat-body">
                <div
                  className="product-chat-messages"
                  ref={messagesContainerRef}
                  aria-live="polite"
                >
                  {messages.length === 0 && (
                    <div className="product-chat-empty">
                      <span className="product-chat-empty__eyebrow">
                        Start here
                      </span>
                      <p className="product-chat-empty__title">
                        Ask any question about this product.
                      </p>
                      <p className="product-chat-empty__copy">
                        Try specs, what&apos;s in the box, warranty, shipping,
                        or compatibility.
                      </p>
                      <div className="product-chat-empty__prompts">
                        {STARTER_PROMPTS.map((prompt) => (
                          <button
                            key={prompt.label}
                            type="button"
                            onClick={() => handleStarterPrompt(prompt.question)}
                            disabled={loading || !!contextError}
                          >
                            {prompt.label}
                          </button>
                        ))}
                      </div>
                      {contextError && (
                        <p className="product-chat-error">{contextError}</p>
                      )}
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
                          type: 'markdown',
                        });
                      }

                      // Also find plain WhatsApp URLs that might appear as text
                      const whatsappUrlRegex = /https?:\/\/wa\.me\/[^\s\)]+/g;
                      while ((match = whatsappUrlRegex.exec(text)) !== null) {
                        // Only add if not already in a markdown link
                        const isInMarkdown = matches.some(
                          (m) =>
                            match.index >= m.index &&
                            match.index < m.index + m.length,
                        );
                        if (!isInMarkdown) {
                          matches.push({
                            index: match.index,
                            length: match[0].length,
                            text: 'WhatsApp',
                            url: match[0],
                            type: 'url',
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
                            className="product-chat-link"
                          >
                            {match.text}
                          </a>,
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
                      <div
                        key={idx}
                        className={`product-chat-bubble ${msg.role}`}
                      >
                        <span className="product-chat-role">
                          {msg.role === 'assistant' ? 'AI' : 'You'}
                        </span>
                        <p>{parseLinks(msg.content)}</p>
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="product-chat-bubble assistant product-chat-bubble--loading">
                      <span className="product-chat-role">AI</span>
                      <div className="product-chat-typing" aria-label="AI is thinking">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <form className="product-chat-input" onSubmit={handleSend}>
                <div className="product-chat-input-shell">
                  <div className="product-chat-input-row">
                    <textarea
                      rows={3}
                      placeholder="Type your question here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={!!contextError}
                      ref={inputRef}
                      maxLength={1200}
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim() || !!contextError}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  {/* <div className="product-chat-input-meta">
                    <span>Press Enter to send. Use Shift+Enter for a new line.</span>
                  </div> */}
                </div>
                {error && <p className="product-chat-error">{error}</p>}
              </form>
            </div>
          </div>
        )}
      </>
    );
  },
);

ProductFAQ.displayName = 'ProductFAQ';

export default ProductFAQ;
