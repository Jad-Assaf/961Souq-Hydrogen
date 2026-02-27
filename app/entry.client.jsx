import {RemixBrowser} from '@remix-run/react';
import {hydrateRoot} from 'react-dom/client';

function describeNode(node) {
  if (node instanceof Comment) {
    const text = (node.data || '').trim();
    return `#comment${text ? ` "${text.slice(0, 80)}"` : ''}`;
  }

  if (!(node instanceof Element)) return node?.nodeName || 'unknown';

  const id = node.id ? `#${node.id}` : '';
  const cls =
    typeof node.className === 'string' && node.className.trim()
      ? `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';

  if (node.tagName === 'SCRIPT') {
    return `${node.tagName.toLowerCase()}${id}${cls} src="${
      node.getAttribute('src') || 'inline'
    }" nonce="${node.getAttribute('nonce') || ''}"`;
  }

  if (node.tagName === 'LINK') {
    return `${node.tagName.toLowerCase()}${id}${cls} rel="${node.getAttribute(
      'rel',
    )}" href="${node.getAttribute('href')}"`;
  }

  if (node.tagName === 'STYLE') {
    return `${node.tagName.toLowerCase()}${id}${cls} len=${
      node.textContent?.length || 0
    }`;
  }

  return `${node.tagName.toLowerCase()}${id}${cls}`;
}

function captureDomSnapshot() {
  const headNodes = Array.from(document.head.childNodes)
    .slice(0, 25)
    .map(describeNode);
  const bodyNodes = Array.from(document.body.childNodes)
    .slice(0, 25)
    .map(describeNode);

  return {headNodes, bodyNodes};
}

const initialSnapshot =
  typeof document !== 'undefined' ? captureDomSnapshot() : null;

const hydrateOptions = import.meta.env.DEV
  ? {
      onRecoverableError(error, info) {
        console.groupCollapsed('[Hydration] Recoverable error');
        console.error(error);
        if (info?.componentStack) {
          console.log('Component stack:', info.componentStack);
        }
        if (error?.cause) {
          console.log('Cause:', error.cause);
        }
        console.log('URL:', window.location.href);
        console.log('Initial DOM snapshot:', initialSnapshot);
        console.log('Current DOM snapshot:', captureDomSnapshot());
        console.groupEnd();
      },
    }
  : undefined;

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  hydrateRoot(document, <RemixBrowser />, hydrateOptions);
}
