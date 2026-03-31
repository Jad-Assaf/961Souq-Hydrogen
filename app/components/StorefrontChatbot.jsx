import {Image} from '@shopify/hydrogen';
import {Link, useRevalidator} from 'react-router';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useAside} from './Aside';

const STORAGE_KEY = 'storefront-chatbot-state-v2';
const LEGACY_STORAGE_KEY = 'storefront-chatbot-history-v1';
export const STOREFRONT_CHATBOT_OPEN_EVENT = 'storefront-chatbot:open';
const STARTER_PROMPTS = [
  {label: 'Find a laptop', question: 'I need a good gaming laptop.'},
  {
    label: 'Shipping help',
    question: 'What is your shipping policy inside Lebanon?',
  },
  {label: 'Show my cart', question: 'What is in my cart right now?'},
  {label: 'Track order', question: 'Can you check my latest order?'},
];
const DEFAULT_STATE = {
  messages: [],
  isOpen: false,
  input: '',
};

function createMessageId(role) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHref(rawHref) {
  const value = String(rawHref || '').trim();
  if (!value || /^(javascript|data):/i.test(value)) {
    return null;
  }

  try {
    const baseOrigin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://961souq.com';
    const parsed = new URL(value, baseOrigin);
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const currentHostname =
      typeof window !== 'undefined'
        ? window.location.hostname.replace(/^www\./i, '').toLowerCase()
        : '961souq.com';
    const isInternal =
      value.startsWith('/') ||
      hostname === currentHostname ||
      hostname === '961souq.com' ||
      hostname === '961souqs.myshopify.com';

    if (isInternal) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    }

    return parsed.toString().replace(/^(https?:\/\/)www\./i, '$1');
  } catch {
    return value.startsWith('/') ? value : null;
  }
}

function normalizeCard(card) {
  if (!card || typeof card !== 'object') {
    return null;
  }

  const href = normalizeHref(card.href || card.url);
  const title = String(card.title || '').trim();
  if (!href || !title) {
    return null;
  }

  return {
    kind:
      String(card.kind || '')
        .trim()
        .toLowerCase() === 'collection'
        ? 'collection'
        : 'product',
    href,
    title,
    imageUrl: String(card.image_url || card.imageUrl || '').trim() || null,
    price: String(card.price || '').trim() || null,
    subtitle: String(card.subtitle || '').trim() || null,
  };
}

function isLikelyHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

function isProductOrCollectionHref(href) {
  return /^\/(products|collections)\//i.test(String(href || ''));
}

function convertLegacyMarkdownToHtml(text) {
  const blocks = String(text || '')
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean);

  const htmlBlocks = blocks.map((block) => {
    let html = escapeHtml(block);
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, href) =>
        `<a href="${escapeHtml(normalizeHref(href) || href)}">${escapeHtml(
          label,
        )}</a>`,
    );
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br />');
    return `<p>${html}</p>`;
  });

  return htmlBlocks.join('') || `<p>${escapeHtml(String(text || ''))}</p>`;
}

function sanitizeAssistantNode(node, cardHrefs) {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toUpperCase();
  const children = Array.from(node.childNodes)
    .map((child) => sanitizeAssistantNode(child, cardHrefs))
    .join('');

  if (tag === 'BR') {
    return '<br />';
  }

  if (tag === 'A') {
    const href = normalizeHref(node.getAttribute('href'));
    if (!href) {
      return children;
    }

    if (isProductOrCollectionHref(href) && cardHrefs.has(href)) {
      return children;
    }

    const attrs = [`href="${escapeHtml(href)}"`, 'class="product-chat-link"'];
    if (/^https?:\/\//i.test(href)) {
      attrs.push('target="_blank"', 'rel="noopener noreferrer"');
    }

    return `<a ${attrs.join(' ')}>${children}</a>`;
  }

  if (!['P', 'UL', 'OL', 'LI', 'STRONG', 'EM'].includes(tag)) {
    return children;
  }

  const loweredTag = tag.toLowerCase();
  return `<${loweredTag}>${children}</${loweredTag}>`;
}

function sanitizeAssistantHtml(rawHtml, cards = []) {
  const source = String(rawHtml || '').trim();
  if (!source) {
    return '';
  }

  const candidate = isLikelyHtml(source)
    ? source
    : convertLegacyMarkdownToHtml(source);

  if (typeof DOMParser === 'undefined') {
    return convertLegacyMarkdownToHtml(source);
  }

  const document = new DOMParser().parseFromString(candidate, 'text/html');
  const cardHrefs = new Set(
    cards.map((card) => normalizeHref(card?.href)).filter(Boolean),
  );

  return (
    Array.from(document.body.childNodes)
      .map((node) => sanitizeAssistantNode(node, cardHrefs))
      .join('')
      .trim() || convertLegacyMarkdownToHtml(source)
  );
}

function createUserMessage(content, id) {
  const value = String(content || '').trim();
  return {
    id: id || createMessageId('user'),
    role: 'user',
    content: value,
    html: '',
    cards: [],
  };
}

function createAssistantMessage(content, options = {}) {
  const value = String(content || '').trim();
  const cards = Array.isArray(options.cards)
    ? options.cards.map(normalizeCard).filter(Boolean)
    : [];

  return {
    id: options.id || createMessageId('assistant'),
    role: 'assistant',
    content: value,
    html: sanitizeAssistantHtml(options.html || value, cards),
    cards,
  };
}

function normalizeStoredMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  if (message.role === 'assistant') {
    const assistant = createAssistantMessage(message.content, {
      id: typeof message.id === 'string' ? message.id : undefined,
      html: message.html,
      cards: message.cards,
    });

    return assistant.content ? assistant : null;
  }

  if (message.role === 'user') {
    const user = createUserMessage(
      typeof message.content === 'string' ? message.content : '',
      typeof message.id === 'string' ? message.id : undefined,
    );

    return user.content ? user : null;
  }

  return null;
}

function loadStoredChatState() {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current);
      const messages = Array.isArray(parsed?.messages)
        ? parsed.messages.map(normalizeStoredMessage).filter(Boolean)
        : [];

      return {
        messages,
        isOpen: Boolean(parsed?.isOpen),
        input: typeof parsed?.input === 'string' ? parsed.input : '',
      };
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const messages = Array.isArray(parsed)
        ? parsed.map(normalizeStoredMessage).filter(Boolean)
        : [];

      return {
        messages,
        isOpen: false,
        input: '',
      };
    }
  } catch {
    return DEFAULT_STATE;
  }

  return DEFAULT_STATE;
}

function persistChatState(state) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    messages: Array.isArray(state.messages) ? state.messages : [],
    isOpen: Boolean(state.isOpen),
    input: typeof state.input === 'string' ? state.input : '',
  };

  const hasMeaningfulState =
    payload.messages.length > 0 || payload.isOpen || payload.input.trim();

  if (!hasMeaningfulState) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function ChatbotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 12H8.009M11.991 12H12M15.991 12H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatResultCards({cards}) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="product-chat-results-carousel">
      {cards.map((card) => {
        const image = card.imageUrl ? (
          <Image
            alt={card.title}
            src={card.imageUrl}
            width={240}
            height={240}
            className="product-chat-result-image"
          />
        ) : (
          <div className="product-chat-result-image product-chat-result-image--placeholder">
            <span>{card.kind === 'collection' ? 'Collection' : 'Product'}</span>
          </div>
        );

        const content = (
          <>
            <div className="product-chat-result-image-wrap">{image}</div>
            <div className="product-chat-result-meta">
              <span className="product-chat-result-kicker">
                {card.kind === 'collection' ? 'Collection' : 'Product'}
              </span>
              <span className="product-chat-result-title">{card.title}</span>
              {card.price ? (
                <span className="product-chat-result-price">{card.price}</span>
              ) : card.subtitle ? (
                <span className="product-chat-result-subtitle">
                  {card.subtitle}
                </span>
              ) : null}
            </div>
          </>
        );

        if (/^https?:\/\//i.test(card.href)) {
          return (
            <a
              key={card.href}
              href={card.href}
              className={`product-chat-result-card product-chat-result-card--${card.kind}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          );
        }

        return (
          <Link
            key={card.href}
            to={card.href}
            className={`product-chat-result-card product-chat-result-card--${card.kind}`}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export default function StorefrontChatbot() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingCartOpen, setPendingCartOpen] = useState('idle');
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const {open: openAside} = useAside();
  const revalidator = useRevalidator();

  useEffect(() => {
    const storedState = loadStoredChatState();
    setMessages(storedState.messages);
    setIsOpen(storedState.isOpen);
    setInput(storedState.input);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    persistChatState({messages, isOpen, input});
  }, [hasHydrated, input, isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (pendingCartOpen === 'requested' && revalidator.state !== 'idle') {
      setPendingCartOpen('waiting');
      return;
    }

    if (pendingCartOpen !== 'waiting' || revalidator.state !== 'idle') {
      return;
    }

    openAside('cart');
    setPendingCartOpen('idle');
  }, [openAside, pendingCartOpen, revalidator.state]);

  const openChat = useCallback(() => {
    setError('');
    setIsOpen(true);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOpenRequest = () => {
      openChat();
    };

    window.addEventListener(STOREFRONT_CHATBOT_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(
        STOREFRONT_CHATBOT_OPEN_EVENT,
        handleOpenRequest,
      );
    };
  }, [openChat]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setError('');
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setError('');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  const sendMessage = useCallback(
    async (messageText) => {
      const message = String(messageText || '').trim();
      if (!message || loading) return;

      const nextMessages = [...messages, createUserMessage(message)];
      setMessages(nextMessages);
      setInput('');
      setError('');
      setLoading(true);

      const pageContext =
        typeof window === 'undefined'
          ? null
          : {
              url: window.location.href,
              pathname: window.location.pathname,
              title: document.title,
            };

      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            messages: nextMessages,
            pageContext,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.answer) {
          setError(data?.error || 'Unable to get a response right now.');
          return;
        }

        const assistantMessage = createAssistantMessage(data.answer, {
          html: data.answerHtml,
          cards: data.cards,
        });

        setMessages((previous) => [...previous, assistantMessage]);

        if (data?.cartAction?.didChange) {
          setIsOpen(false);
          setPendingCartOpen('requested');
          revalidator.revalidate();
        }
      } catch {
        setError('Unable to get a response right now.');
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, messages, revalidator],
  );

  const handleSend = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const statusLabel = loading ? 'Thinking' : 'Ready';
  const statusTone = loading ? 'thinking' : 'ready';

  return (
    <>
      <button
        type="button"
        className={`store-chatbot-float${isOpen ? ' is-hidden' : ''}`}
        onClick={openChat}
        aria-label="Open the AI shopping assistant"
      >
        <span className="store-chatbot-float__icon">
          <ChatbotIcon />
        </span>
        <span className="store-chatbot-float__copy">
          <strong>Ask AI</strong>
          <span>Shop, cart, orders</span>
        </span>
      </button>

      {isOpen && (
        <div
          className="ai-modal-overlay product-chat-overlay store-chatbot-overlay"
          role="button"
          tabIndex={0}
          aria-label="Close the AI shopping assistant"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeChat();
            }
          }}
          onKeyDown={(event) => {
            if (
              event.target === event.currentTarget &&
              (event.key === 'Enter' || event.key === ' ')
            ) {
              event.preventDefault();
              closeChat();
            }
          }}
        >
          <div
            className="ai-modal product-chat-modal store-chatbot-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-chatbot-title"
          >
            <div className="ai-modal__header product-chat-modal__header">
              <div className="product-chat-modal__titleblock">
                <div className="ai-modal__left">
                  <span className="ai-modal__chip">961 Souq AI</span>
                  <span
                    className={`ai-modal__status product-chat-status product-chat-status--${statusTone}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <h2
                  id="store-chatbot-title"
                  className="product-chat-modal__title"
                >
                  Store assistant
                </h2>
                <p className="product-chat-modal__subtitle">
                  Search products, compare options, update the cart, and help
                  signed-in customers with account or order questions.
                </p>
              </div>
              <div className="ai-modal__actions product-chat-modal__actions">
                <button
                  type="button"
                  className="ai-modal__clear"
                  onClick={clearChat}
                  disabled={loading || messages.length === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="ai-modal__close"
                  onClick={closeChat}
                  aria-label="Close the AI shopping assistant"
                >
                  ✕
                </button>
              </div>
              <span className="ai-modal__disclaimer product-chat-modal__disclaimer">
                AI can make mistakes. Confirm important details before checkout.
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
                      Store-wide help
                    </span>
                    <p className="product-chat-empty__title">
                      Ask about products, policies, cart actions, or orders.
                    </p>
                    <p className="product-chat-empty__copy">
                      The assistant can search the catalog, look up policy
                      answers, update your cart, and read signed-in account
                      data.
                    </p>
                    <div className="product-chat-empty__prompts">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.label}
                          type="button"
                          onClick={() => void sendMessage(prompt.question)}
                          disabled={loading}
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`product-chat-bubble ${message.role}`}
                  >
                    <span className="product-chat-role">
                      {message.role === 'assistant' ? 'AI' : 'You'}
                    </span>
                    {message.role === 'assistant' ? (
                      <>
                        <div
                          className="product-chat-message-html"
                          dangerouslySetInnerHTML={{__html: message.html}}
                        />
                        <ChatResultCards cards={message.cards} />
                      </>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="product-chat-bubble assistant product-chat-bubble--loading">
                    <span className="product-chat-role">AI</span>
                    <div
                      className="product-chat-typing"
                      aria-label="AI is thinking"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form className="product-chat-input" onSubmit={handleSend}>
              <div className="product-chat-input-shell">
                <div className="product-chat-input-row">
                  <textarea
                    ref={inputRef}
                    rows={3}
                    maxLength={1200}
                    value={input}
                    placeholder="Ask Anything..."
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend(event);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label={loading ? 'Sending message' : 'Send message'}
                  >
                    <SendIcon />
                    <span className="visually-hidden">
                      {loading ? 'Sending...' : 'Send'}
                    </span>
                  </button>
                </div>
              </div>
              {error && <p className="product-chat-error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
