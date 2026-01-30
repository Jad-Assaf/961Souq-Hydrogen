import {data, Form, NavLink, Outlet, useLoaderData} from '@remix-run/react';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import '../styles/Account.css';

export function shouldRevalidate() {
  return true;
}

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return data(
      {customer: null, isLoggedIn},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  }

  const {data: customerData, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  if (errors?.length || !customerData?.customer) {
    throw new Error('Customer not found');
  }

  return data(
    {customer: customerData.customer, isLoggedIn},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer, isLoggedIn} = useLoaderData();

  const firstName = customer?.firstName?.trim() || '';
  const lastName = customer?.lastName?.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const addressCount = customer?.addresses?.nodes?.length ?? 0;
  const heading = firstName ? `Welcome back, ${firstName}` : 'Welcome back';
  const addressSummary = isLoggedIn
    ? formatAddressSummary(customer?.defaultAddress)
    : 'Sign in to view';
  const addressLabel = addressCount === 1 ? 'address saved' : 'addresses saved';

  return (
    <div className="account-shell">
      <header className="account-hero">
        <div className="account-hero-content">
          <p className="account-eyebrow">Customer account</p>
          <h1 className="account-title">
            {isLoggedIn ? heading : 'Sign in to your account'}
          </h1>
          <p className="account-subtitle">
            {isLoggedIn
              ? 'Track orders, update details, and keep delivery addresses ready for checkout.'
              : 'Access your orders, saved addresses, and profile in one place.'}
          </p>
          {isLoggedIn ? (
            <div className="account-hero-actions">
              <NavLink className="account-button" to="/account/orders">
                View orders
              </NavLink>
              <NavLink
                className="account-button account-button--ghost"
                to="/account/profile"
              >
                Edit profile
              </NavLink>
            </div>
          ) : (
            <div className="account-hero-actions">
              <NavLink className="account-button" to="/account/login">
                Continue to sign in
              </NavLink>
              <NavLink
                className="account-button account-button--ghost"
                to="/pages/contact"
              >
                Need help?
              </NavLink>
            </div>
          )}
        </div>
        <div className="account-hero-card">
          <div className="account-hero-row">
            <span className="account-hero-label">Profile</span>
            <span className="account-hero-value">
              {isLoggedIn ? fullName || 'Customer' : 'Guest'}
            </span>
          </div>
          <div className="account-hero-row">
            <span className="account-hero-label">Default address</span>
            <span className="account-hero-value">{addressSummary}</span>
          </div>
          <div className="account-hero-row">
            <span className="account-hero-label">Saved</span>
            <span className="account-hero-value">
              {isLoggedIn ? `${addressCount} ${addressLabel}` : 'Sign in to view'}
            </span>
          </div>
        </div>
      </header>

      {isLoggedIn ? (
        <div className="account-frame">
          <aside className="account-nav">
            <div className="account-nav-header">
              <h2>Account</h2>
              <p>Everything in one place.</p>
            </div>
            <AccountMenu />
          </aside>
          <section className="account-content">
            <Outlet context={{customer}} />
          </section>
        </div>
      ) : (
        <section className="account-guest">
          <div className="account-guest-card">
            <h2>Welcome to 961Souq accounts</h2>
            <p>
              Sign in to see your orders, manage delivery details, and check
              out faster.
            </p>
            <div className="account-guest-actions">
              <NavLink className="account-button" to="/account/login">
                Sign in
              </NavLink>
              <NavLink className="account-link" to="/collections">
                Continue shopping
              </NavLink>
            </div>
          </div>
          <div className="account-guest-grid">
            <div className="account-guest-tile">
              <h3>Track orders</h3>
              <p>Follow shipping updates and download receipts anytime.</p>
            </div>
            <div className="account-guest-tile">
              <h3>Save addresses</h3>
              <p>Store delivery details to speed up checkout.</p>
            </div>
            <div className="account-guest-tile">
              <h3>Profile control</h3>
              <p>Keep your name and contact preferences up to date.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="account-nav-links" role="navigation">
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        end
        to="/account"
      >
        Overview
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/orders"
      >
        Orders
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/profile"
      >
        Profile
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/addresses"
      >
        Addresses
      </NavLink>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button className="account-nav-link account-nav-action" type="submit">
        Sign out
      </button>
    </Form>
  );
}

/**
 * @param {CustomerFragment['defaultAddress'] | null | undefined} address
 */
function formatAddressSummary(address) {
  if (!address) return 'No default address';
  if (address.formatted?.length) return address.formatted.join(', ');
  const fallback = [
    address.address1,
    address.city,
    address.zoneCode,
    address.territoryCode,
  ]
    .filter(Boolean)
    .join(', ');
  return fallback || 'Default address saved';
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
