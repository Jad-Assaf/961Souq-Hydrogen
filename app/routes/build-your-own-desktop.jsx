import React, {useState, useMemo, useEffect, useRef} from 'react';
import {useLoaderData, useFetcher, Link} from '@remix-run/react';
import '../styles/Build-Your-Own.css';

// Define valid tags for CPU and Memory filtering.
const CPU_VALID_TAGS = [
  'intel 14th',
  'intel 13th',
  'intel 12th',
  'intel 11th',
  'intel 10th',
  'ryzen 3000',
  'ryzen 4000',
  'ryzen 5000',
  'ryzen 7000',
  'ryzen 8000',
  'ryzen 9000',
];
const MEMORY_VALID_TAGS = ['ddr4 support', 'ddr5 support'];

// Desired order: GPU, CPU, Motherboard, RAM, Case, Cooling, Storage, PSU.
const CATEGORY_ORDER = [
  'GPU',
  'CPU',
  'Motherboard',
  'RAM',
  'Case',
  'Cooling',
  'Storage',
  'PSU',
];

// Mapping between category names and Shopify collection handles.
const CATEGORY_HANDLES = {
  GPU: 'gpu',
  CPU: 'cpus',
  Motherboard: 'motherboards',
  Case: 'cases',
  Cooling: 'cpu-coolers',
  RAM: 'ram',
  Storage: 'internal-storage',
  PSU: 'power-supply',
};

// Build the list of categories.
const CATEGORIES = CATEGORY_ORDER.map((name) => ({name}));

// --- PSU Recommendation Helpers ---
function extractRecommendedPSUWattage(gpu) {
  if (!gpu || !gpu.description) return 0;
  const match = gpu.description.match(/(\d+)\s*(W|watt)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractPSUWattage(psu) {
  if (!psu) return 0;
  let wattage = 0;
  const matchModel = psu.model.match(/(\d+)\s*(W|watt)/i);
  if (matchModel) {
    wattage = parseInt(matchModel[1], 10);
  }
  if (!wattage && psu.description) {
    const matchDesc = psu.description.match(/(\d+)\s*(W|watt)/i);
    wattage = matchDesc ? parseInt(matchDesc[1], 10) : 0;
  }
  return wattage;
}
// --- End PSU Helpers ---

// --- Form Factor Extraction Helpers ---
function extractFormFactor(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  if (/\be[-\s]?atx\b/i.test(lowerText)) {
    return {factor: 'EATX', order: 3};
  }
  if (/\b(micro[-\s]?atx|matx)\b/i.test(lowerText)) {
    return {factor: 'Micro ATX', order: 1};
  }
  if (/\bmini[-\s]?atx\b/i.test(lowerText)) {
    return {factor: 'Mini ATX', order: 0};
  }
  if (/\batx\b/i.test(lowerText)) {
    return {factor: 'ATX', order: 2};
  }
  return null;
}
// --- End Form Factor Helpers ---

// --- Quantity Selector Component ---
function QuantitySelector({max, onChange}) {
  const [quantity, setQuantity] = useState(1);
  const handleIncrement = (e) => {
    e.stopPropagation();
    setQuantity((q) => {
      const newQty = Math.min(q + 1, max);
      if (onChange) onChange(newQty);
      return newQty;
    });
  };
  const handleDecrement = (e) => {
    e.stopPropagation();
    setQuantity((q) => {
      const newQty = Math.max(q - 1, 1);
      if (onChange) onChange(newQty);
      return newQty;
    });
  };
  return (
    <div
      className="quantity-selector"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '5px',
        justifyContent: 'center',
      }}
    >
      <span>Qty:</span>
      <button
        type="button"
        onClick={handleDecrement}
        style={{
          padding: '0px 5px',
          border: '1px solid #2172af',
          borderRadius: '30px',
          width: '25px',
          height: '25px',
          fontSize: '15px',
        }}
      >
        -
      </button>
      <span
        className="quantity-value"
        style={{minWidth: '20px', textAlign: 'center'}}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        style={{
          padding: '0px 5px',
          border: '1px solid #2172af',
          borderRadius: '30px',
          width: '25px',
          height: '25px',
          fontSize: '15px',
        }}
      >
        +
      </button>
    </div>
  );
}

// --- Loader ---
// (Unchanged – it loads only the main collection as before.)
export async function loader({context, request}) {
  const url = new URL(request.url);
  const handle =
    url.searchParams.get('handle') || CATEGORY_HANDLES[CATEGORIES[0].name];

  const QUERY = `
    query ProductsByCollection($handle: String!) {
      collectionByHandle(handle: $handle) {
        products(first: 250) {
          edges {
            node {
              id
              handle
              title
              vendor
              productType
              descriptionHtml
              tags
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
                      amount
                    }
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await context.storefront.query(QUERY, {variables: {handle}});

  const products =
    data.collectionByHandle?.products?.edges.flatMap(({node: product}) => {
      if (
        product.variants &&
        product.variants.edges.length === 1 &&
        product.variants.edges[0].node.title === 'Default Title'
      ) {
        const price =
          parseFloat(product.priceRange.minVariantPrice.amount) || 100;
        return [
          {
            id: product.id,
            handle: product.handle,
            manufacturer: product.vendor,
            model: product.title,
            description: product.descriptionHtml,
            tags: product.tags || [],
            image:
              product.images.edges[0]?.node.url ||
              'https://via.placeholder.com/300?text=No+Image',
            specs: [],
            price,
          },
        ];
      } else if (product.variants && product.variants.edges.length > 0) {
        return product.variants.edges.map(({node: variant}) => ({
          id: `${product.id}-${variant.id}`,
          handle: product.handle,
          manufacturer: product.vendor,
          model: `${product.title} - ${variant.title}`,
          description: product.descriptionHtml,
          tags: product.tags || [],
          image: variant.image
            ? variant.image.url
            : product.images.edges[0]?.node.url ||
              'https://via.placeholder.com/300?text=No+Image',
          specs: [],
          price: parseFloat(variant.priceV2.amount) || 100,
        }));
      }
      const price =
        parseFloat(product.priceRange.minVariantPrice.amount) || 100;
      return [
        {
          id: product.id,
          handle: product.handle,
          manufacturer: product.vendor,
          model: product.title,
          description: product.descriptionHtml,
          tags: product.tags || [],
          image:
            product.images.edges[0]?.node.url ||
            'https://via.placeholder.com/300?text=No+Image',
          specs: [],
          price,
        },
      ];
    }) || [];

  return {products, currentHandle: handle};
}

// --- Main Component ---
export default function PCBuilder() {
  const {products, currentHandle} = useLoaderData();
  const fetcher = useFetcher();
  // Separate fetcher for accessory collections
  const accessoryFetcher = useFetcher();

  const initialIndex =
    CATEGORIES.findIndex(
      (cat) => CATEGORY_HANDLES[cat.name] === currentHandle,
    ) || 0;
  const [currentStep, setCurrentStep] = useState(initialIndex);
  const [selectedItems, setSelectedItems] = useState({});
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [currentItems, setCurrentItems] = useState(products);
  const [showInstructions, setShowInstructions] = useState(true);

  // State for additional accessory selection
  const [selectedAccessory, setSelectedAccessory] = useState('gaming-monitors');
  // Store the accessory products loaded from the server
  const [accessoryProducts, setAccessoryProducts] = useState([]);
  // Store the accessory products that the user has added to their build
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  const summaryRef = useRef(null);

  // Load main collection products when current step changes.
  useEffect(() => {
    const categoryName = CATEGORIES[currentStep].name;
    const handle = CATEGORY_HANDLES[categoryName];
    fetcher.load(`/build-your-own-desktop?handle=${handle}`);
  }, [currentStep]);

  useEffect(() => {
    if (fetcher.data?.products) {
      setCurrentItems(fetcher.data.products);
    }
  }, [fetcher.data]);

  // When an accessory is selected, load its products using the same endpoint.
  useEffect(() => {
    if (selectedAccessory) {
      accessoryFetcher.load(
        `/build-your-own-desktop?handle=${selectedAccessory}`,
      );
    }
  }, [selectedAccessory]);

  useEffect(() => {
    if (accessoryFetcher.data?.products) {
      setAccessoryProducts(accessoryFetcher.data.products);
    }
  }, [accessoryFetcher.data]);

  const filteredItems = useMemo(() => {
    let items = currentItems.filter((item) => {
      const matchesManufacturer =
        manufacturerFilter === '' ||
        item.manufacturer
          .toLowerCase()
          .includes(manufacturerFilter.toLowerCase());
      const matchesModel =
        modelFilter === '' ||
        item.model.toLowerCase().includes(modelFilter.toLowerCase());
      return matchesManufacturer && matchesModel;
    });

    if (CATEGORIES[currentStep].name === 'Motherboard' && selectedItems[1]) {
      const selectedCPU = selectedItems[1];
      const cpuTags = (selectedCPU.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => CPU_VALID_TAGS.includes(t));
      items = items.filter((item) => {
        const mbTags = (item.tags || []).map((t) => t.toLowerCase());
        return cpuTags.some((tag) => mbTags.includes(tag));
      });
    }

    if (CATEGORIES[currentStep].name === 'RAM' && selectedItems[2]) {
      const selectedMB = selectedItems[2];
      const mbMemoryTags = (selectedMB.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => MEMORY_VALID_TAGS.includes(t));
      items = items.filter((item) => {
        const memTags = (item.tags || []).map((t) => t.toLowerCase());
        return mbMemoryTags.some((tag) => memTags.includes(tag));
      });
    }

    if (CATEGORIES[currentStep].name === 'Case' && selectedItems[2]) {
      const selectedMB = selectedItems[2];
      const mbText = `${selectedMB.model} ${selectedMB.description || ''}`;
      const mbForm = extractFormFactor(mbText);
      if (mbForm) {
        items = items.filter((item) => {
          const caseText = `${item.model} ${item.description || ''}`;
          const caseForm = extractFormFactor(caseText);
          if (!caseForm) return false;
          return caseForm.order >= mbForm.order;
        });
      }
    }

    if (CATEGORIES[currentStep].name === 'PSU' && selectedItems[0]) {
      const recommendedWattage = extractRecommendedPSUWattage(selectedItems[0]);
      items = items.filter(
        (item) => extractPSUWattage(item) >= recommendedWattage,
      );
    }

    if (CATEGORIES[currentStep].name === 'Storage') {
      items = items.filter(
        (item) =>
          !item.tags.some(
            (tag) => tag.toLowerCase() === 'internal hdd storage',
          ),
      );
    }

    return items;
  }, [
    currentItems,
    manufacturerFilter,
    modelFilter,
    currentStep,
    selectedItems,
  ]);

  const selectedItem = selectedItems[currentStep];

  function handleSelectItem(item) {
    if (
      CATEGORIES[currentStep].name === 'RAM' ||
      CATEGORIES[currentStep].name === 'Storage'
    ) {
      item.quantity = item.quantity || 1;
    }
    setSelectedItems((prev) => {
      const newSelected = {
        ...prev,
        [currentStep]: item,
      };
      if (currentStep === CATEGORIES.length - 1 && summaryRef.current) {
        summaryRef.current.scrollIntoView({behavior: 'smooth'});
      }
      return newSelected;
    });
  }

  function handleNext() {
    if (currentStep < CATEGORIES.length - 1 && selectedItems[currentStep]) {
      setCurrentStep(currentStep + 1);
      setManufacturerFilter('');
      setModelFilter('');
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setManufacturerFilter('');
      setModelFilter('');
    }
  }

  function handleRemoveItem(categoryIndex) {
    setSelectedItems((prev) => {
      const newSelected = {...prev};
      Object.keys(newSelected).forEach((key) => {
        if (parseInt(key, 10) >= categoryIndex) {
          delete newSelected[key];
        }
      });
      return newSelected;
    });
    if (currentStep >= categoryIndex) {
      setCurrentStep(categoryIndex);
    }
  }

  // New function to add an accessory to the build
  function handleSelectAccessory(product) {
    setSelectedAccessories((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev; // Prevent duplicates
      }
      return [...prev, product];
    });
  }

  // Function to remove an accessory from the build
  function handleRemoveAccessory(id) {
    setSelectedAccessories((prev) => prev.filter((p) => p.id !== id));
  }

  // Calculate total price including main selected items and accessory items.
  const mainTotal = Object.values(selectedItems).reduce((total, item) => {
    const qty = item.quantity || 1;
    return total + item.price * qty;
  }, 0);
  const accessoriesTotal = selectedAccessories.reduce((total, item) => {
    const qty = item.quantity || 1;
    return total + item.price * qty;
  }, 0);
  const totalPrice = mainTotal + accessoriesTotal;

  // Build the final summary details including both main items and accessory items.
  const selectedDetailsMain = Object.keys(selectedItems)
    .map((catIndex) => {
      const category = CATEGORIES[catIndex].name;
      const item = selectedItems[catIndex];
      const qty = item.quantity || 1;
      return `• *${category}:* ${item.model} (Qty: ${qty}, Price: ${item.price})`;
    })
    .join('\n');
  const selectedDetailsAccessories = selectedAccessories
    .map((item) => {
      const qty = item.quantity || 1;
      return `• *Accessory:* ${item.model} (Qty: ${qty}, Price: ${item.price})`;
    })
    .join('\n');
  const whatsappMessage = `Hello, I'm interested in the following configuration:
${selectedDetailsMain}
${
  selectedDetailsAccessories
    ? '\nAdditional Accessories:\n' + selectedDetailsAccessories
    : ''
}
\nTotal Approximate Price: $${totalPrice}`;
  const whatsappLink = `https://wa.me/96103020030?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <div className="pcBldr-container">
      {showInstructions && (
        <div className="instructions-overlay">
          <div className="instructions-modal">
            <h2>Welcome to the PC Builder</h2>
            <ol>
              <li>
                <strong>Item Selection</strong>: Click on an item to select it.
                For further details, use the "View Product" button.
              </li>
              <li>
                <strong>Sequential Component Selection</strong>: Each component
                tab becomes accessible only after you have made a selection in
                the previous category, ensuring optimal compatibility.
              </li>
              <li>
                <strong>Finalizing Your Build</strong>: After you have chosen
                all components, scroll down and click the "Contact" button. This
                will send us your custom configuration, and we will respond
                promptly.
              </li>
            </ol>
            <button
              onClick={() => setShowInstructions(false)}
              className="start-button"
            >
              <span>Start</span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="pcBldr-sidebar">
        <div className="pcBldr-sidebar-div">
          <h2 className="pcBldr-title">Gaming Desktop Builder</h2>
          <nav className="pcBldr-nav">
            {CATEGORIES.map((cat, index) => {
              const isEnabled = index === 0 || !!selectedItems[index - 1];
              const isActive = index === currentStep;
              const tooltipMessage =
                !isEnabled && index > 0
                  ? `Choose a ${CATEGORIES[index - 1].name} first!`
                  : '';
              return (
                <div
                  key={cat.name}
                  className={`pcBldr-navItem ${
                    isActive ? 'pcBldr-navItemActive' : ''
                  } ${!isEnabled ? 'pcBldr-navItemDisabled' : ''}`}
                  onClick={isEnabled ? () => setCurrentStep(index) : undefined}
                  title={tooltipMessage}
                >
                  {cat.name}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pcBldr-main">
        <section className="pcBldr-filtersSection">
          <div className="pcBldr-itemList">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`pcBldr-item ${
                    isSelected ? 'pcBldr-itemActive' : ''
                  }`}
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="pcBldr-item-top">
                    <img
                      src={`${item.image}&quality=10`}
                      alt={item.model}
                      width={100}
                      height={100}
                      loading="lazy"
                    />
                    <div className="pcBldr-product-title">{item.model}</div>
                    {isSelected &&
                      (CATEGORIES[currentStep].name === 'RAM' ||
                        CATEGORIES[currentStep].name === 'Storage') && (
                        <QuantitySelector
                          max={CATEGORIES[currentStep].name === 'RAM' ? 4 : 2}
                          onChange={(newQty) => {
                            setSelectedItems((prev) => ({
                              ...prev,
                              [currentStep]: {
                                ...prev[currentStep],
                                quantity: newQty,
                              },
                            }));
                          }}
                        />
                      )}
                  </div>
                  <div className="pcBldr-product-price">${item.price}</div>
                  <Link
                    to={`/products/${item.handle}`}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    className="pcBldr-viewMoreBtn"
                  >
                    View Product
                  </Link>
                </div>
              );
            })}
          </div>
          {!(
            currentStep === CATEGORIES.length - 1 && selectedItems[currentStep]
          ) && (
            <div className="pcBldr-navigationButtons">
              <button onClick={handlePrevious} disabled={currentStep === 0}>
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedItems[currentStep]}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="pcBldr-selectedSection" ref={summaryRef}>
          <div className="pcBldr-selectedSummary">
            <h3>All Selected Items</h3>
            {Object.keys(selectedItems).length === 0 ? (
              <p>No items selected yet.</p>
            ) : (
              Object.keys(selectedItems).map((catIndex) => {
                const item = selectedItems[catIndex];
                const categoryName = CATEGORIES[catIndex].name;
                return (
                  <div key={catIndex} className="pcBldr-selectedSummaryItem">
                    <span>
                      <strong>{categoryName}:</strong> {item.model}{' '}
                      {item.quantity ? `(Qty: ${item.quantity})` : ''}
                    </span>
                    <button
                      className="pcBldr-remove-btn"
                      onClick={() => handleRemoveItem(catIndex)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
            {/* Display selected accessories in final summary */}
            {selectedAccessories.length > 0 && (
              <>
                <h3>Additional Accessories</h3>
                {selectedAccessories.map((item) => (
                  <div key={item.id} className="pcBldr-selectedSummaryItem">
                    <span>
                      <strong>Accessory:</strong> {item.model}{' '}
                      {item.quantity ? `(Qty: ${item.quantity})` : ''}
                    </span>
                    <button
                      className="pcBldr-remove-btn"
                      onClick={() => handleRemoveAccessory(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            {Object.keys(selectedItems).length > 0 && (
              <div className="final-summary">
                <h4>
                  <strong>Total Approximate Price: </strong>
                  <span style={{color: 'red', fontWeight: '500'}}>
                    ${totalPrice}
                  </span>
                </h4>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#25d366',
                    color: 'white',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    marginTop: '10px',
                  }}
                >
                  Contact via WhatsApp
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Additional Gaming Accessories Section */}
        {Object.keys(selectedItems).length === CATEGORIES.length && (
          <section className="pcBldr-accessoriesSection">
            <h3>Additional Gaming Accessories</h3>
            <div className="accessories-buttons">
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-monitors' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-monitors')}
              >
                Monitors
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-headphones' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-headphones')}
              >
                Headphones
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-keyboards' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-keyboards')}
              >
                Keyboards
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-mouse' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-mouse')}
              >
                Mice
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'mousepads' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('mousepads')}
              >
                MousePads
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-speakers' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-speakers')}
              >
                Speakers
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-chairs' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-chairs')}
              >
                Chairs
              </button>
              <button
                className={`accessory-button ${
                  selectedAccessory === 'gaming-desks' ? 'active' : ''
                }`}
                onClick={() => setSelectedAccessory('gaming-desks')}
              >
                Desks
              </button>
            </div>
            {selectedAccessory &&
              accessoryProducts &&
              accessoryProducts.length > 0 && (
                <div className="pcBldr-itemList">
                  {accessoryProducts.map((product) => (
                    <div key={product.id} className="pcBldr-item">
                      <div className="pcBldr-item-top">
                        <img
                          src={`${product.image}&quality=10`}
                          alt={product.model}
                          width={100}
                          height={100}
                          loading="lazy"
                        />
                        <div className="pcBldr-product-title">
                          {product.model}
                        </div>
                      </div>
                      <div className="pcBldr-product-price">
                        ${product.price}
                      </div>
                      <button
                        className="accessory-add-btn"
                        onClick={() => {
                          handleSelectAccessory(product);
                          summaryRef.current.scrollIntoView({
                            behavior: 'smooth',
                          });
                        }}
                      >
                        Add
                      </button>

                      <Link
                        to={`/products/${product.handle}`}
                        target="_blank"
                        className="pcBldr-viewMoreBtn"
                      >
                        View Product
                      </Link>
                    </div>
                  ))}
                </div>
              )}
          </section>
        )}
      </main>
    </div>
  );
}
