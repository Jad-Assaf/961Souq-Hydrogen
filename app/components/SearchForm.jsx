import { useRef, useEffect } from 'react';
import { Form } from '@remix-run/react';

/**
 * Search form component that sends search requests to the `/search` route.
 * @example
 * ```tsx
 * <SearchForm>
 *  {({ inputRef }) => (
 *    <>
 *      <input
 *        ref={inputRef}
 *        type="search"
 *        defaultValue={term}
 *        name="q"
 *        placeholder="Search…"
 *      />
 *      <button type="submit">Search</button>
 *   </>
 *  )}
 *  </SearchForm>
 * @param {SearchFormProps}
 */
export function SearchForm({ children, ...props }) {
  const inputRef = useRef(null);

  useFocusOnCmdK(inputRef);

  const handleInput = (event) => {
    const inputValue = event.target.value;

    // Check if the last character is a space, indicating a word end
    if (inputValue.endsWith(' ')) {
      // Add a wildcard `*` in a hidden input value for the backend, and remove it from displayed input
      const backendValue = inputValue.trim().replace(/ +/g, '* ') + '*';
      event.target.setAttribute('data-backend-value', backendValue); // Store the backend value as an attribute

      // Keep the visible input without wildcards
      event.target.value = inputValue.trim() + ' ';
    }
  };

  if (typeof children !== 'function') {
    return null;
  }

  return (
    <Form method="get" {...props}>
      {children({ inputRef, onInput: handleInput })}
    </Form>
  );
}

/**
 * Focuses the input when cmd+k is pressed.
 * @param {React.RefObject<HTMLInputElement>} inputRef
 */
function useFocusOnCmdK(inputRef) {
  // Focus the input when cmd+k is pressed
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'k' && event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
}

/**
 * @typedef {Omit<FormProps, 'children'> & {
 *   children: (args: {
 *     inputRef: React.RefObject<HTMLInputElement>;
 *   }) => React.ReactNode;
 * }} SearchFormProps
 */

/** @typedef {import('@remix-run/react').FormProps} FormProps */
