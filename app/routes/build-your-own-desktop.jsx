import React, {useState, useMemo, useEffect} from 'react';
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

// Desired order: GPU, CPU, Motherboards, MEMORY, CASE, COOLING, STORAGE, PSU.
const CATEGORY_ORDER = [
  'GPU',
  'CPU',
  'Motherboards',
  'MEMORY',
  'CASE',
  'COOLING',
  'STORAGE',
  'PSU',
];

// Mapping between category names and Shopify collection handles.
const CATEGORY_HANDLES = {
  GPU: 'gpu',
  CPU: 'cpus',
  Motherboards: 'motherboards',
  CASE: 'cases',
  COOLING: 'cpu-coolers',
  MEMORY: 'ram',
  STORAGE: 'internal-storage',
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
function QuantitySelector({max}) {
  const [quantity, setQuantity] = useState(1);
  const handleIncrement = (e) => {
    e.stopPropagation();
    setQuantity((q) => Math.min(q + 1, max));
  };
  const handleDecrement = (e) => {
    e.stopPropagation();
    setQuantity((q) => Math.max(q - 1, 1));
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

    if (CATEGORIES[currentStep].name === 'Motherboards' && selectedItems[1]) {
      const selectedCPU = selectedItems[1];
      const cpuTags = (selectedCPU.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => CPU_VALID_TAGS.includes(t));
      items = items.filter((item) => {
        const mbTags = (item.tags || []).map((t) => t.toLowerCase());
        return cpuTags.some((tag) => mbTags.includes(tag));
      });
    }

    if (CATEGORIES[currentStep].name === 'MEMORY' && selectedItems[2]) {
      const selectedMB = selectedItems[2];
      const mbMemoryTags = (selectedMB.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => MEMORY_VALID_TAGS.includes(t));
      items = items.filter((item) => {
        const memTags = (item.tags || []).map((t) => t.toLowerCase());
        return mbMemoryTags.some((tag) => memTags.includes(tag));
      });
    }

    if (CATEGORIES[currentStep].name === 'CASE' && selectedItems[2]) {
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

    if (CATEGORIES[currentStep].name === 'STORAGE') {
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
      CATEGORIES[currentStep].name === 'MEMORY' ||
      CATEGORIES[currentStep].name === 'STORAGE'
    ) {
      item.quantity = item.quantity || 1;
    }
    setSelectedItems((prev) => ({
      ...prev,
      [currentStep]: item,
    }));
  }

  function handleNext() {
    if (currentStep < CATEGORIES.length - 1 && selectedItems[currentStep]) {
      setCurrentStep(currentStep + 1);
      resetFilters();
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      resetFilters();
    }
  }

  function resetFilters() {
    setManufacturerFilter('');
    setModelFilter('');
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

  const totalPrice = Object.values(selectedItems).reduce((total, item) => {
    const qty = item.quantity || 1;
    return total + item.price * qty;
  }, 0);

  const selectedDetails = Object.keys(selectedItems)
    .map((catIndex) => {
      const category = CATEGORIES[catIndex].name;
      const item = selectedItems[catIndex];
      const qty = item.quantity || 1;
      return `• *${category}:* ${item.model} (Qty: ${qty}, Price: ${item.price})`;
    })
    .join('\n');
  const whatsappMessage = `Hello, I'm interested in the following configuration:\n${selectedDetails}\n\nTotal Approximate Price: $${totalPrice}`;
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
                the previous category, ensuring optimal compatibility. Although
                we strive to provide accurate information, please verify any
                critical details.
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
              <img
                src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/clideo_editor_80e996ef10ce4705981dfd1bef30a303_2.gif?v=1742549670"
                alt="Start"
              />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="pcBldr-sidebar">
        <div className="pcBldr-sidebar-div">
          <h2 className="pcBldr-title">PC BUILDER</h2>
          <nav className="pcBldr-nav">
            {CATEGORIES.map((cat, index) => {
              const isEnabled = index === 0 || !!selectedItems[index - 1];
              const isActive = index === currentStep;
              return (
                <div
                  key={cat.name}
                  className={`pcBldr-navItem ${
                    isActive ? 'pcBldr-navItemActive' : ''
                  } ${!isEnabled ? 'pcBldr-navItemDisabled' : ''}`}
                  onClick={isEnabled ? () => setCurrentStep(index) : undefined}
                >
                  {cat.name}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content area */}
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
                    {(CATEGORIES[currentStep].name === 'MEMORY' ||
                      CATEGORIES[currentStep].name === 'STORAGE') && (
                      <QuantitySelector
                        max={CATEGORIES[currentStep].name === 'MEMORY' ? 4 : 2}
                      />
                    )}
                  </div>
                  <Link
                    to={`/products/${item.handle}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    target="_blank"
                    className="pcBldr-viewMoreBtn"
                  >
                    View Product
                  </Link>
                </div>
              );
            })}
          </div>
          {/* Navigation Buttons */}
          <div
            className="pcBldr-navigationButtons"
            style={{marginTop: '20px', textAlign: 'center'}}
          >
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              style={{marginRight: '10px'}}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={
                !selectedItems[currentStep] ||
                currentStep === CATEGORIES.length - 1
              }
            >
              Next
            </button>
          </div>
        </section>

        <section className="pcBldr-selectedSection">
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
            {Object.keys(selectedItems).length > 0 && (
              <div className="final-summary" style={{marginTop: '20px'}}>
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
                    borderRadius: '5px',
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
      </main>
    </div>
  );
}
