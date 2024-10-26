{
  Array.isArray(subItem.items) && subItem.items.length > 0 && (
    <ul className="sub-submenu">
      {subItem.items.map((subSubItem) => (
        <li key={subSubItem.id}>
          <NavLink className="submenu-link" to={subSubItem.url}>
            {subSubItem.title}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}


/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
