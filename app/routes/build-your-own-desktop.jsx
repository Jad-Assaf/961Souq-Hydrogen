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
// Looks for specific form factor patterns in a text.
function extractFormFactor(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  // EATX: "EATX", "E-ATX", "E ATX"
  if (/\be[-\s]?atx\b/i.test(lowerText)) {
    return {factor: 'EATX', order: 3};
  }
  // Micro ATX: "Micro ATX", "Micro-ATX", "MicroATX", "MATX"
  if (/\b(micro[-\s]?atx|matx)\b/i.test(lowerText)) {
    return {factor: 'Micro ATX', order: 1};
  }
  // Mini ATX: "MiniATX", "Mini-ATX"
  if (/\bmini[-\s]?atx\b/i.test(lowerText)) {
    return {factor: 'Mini ATX', order: 0};
  }
  // Standalone ATX: match "ATX" as a whole word.
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
// The query now includes price fields.
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
      // Determine price:
      // If product has one variant with "Default Title", use the product's minVariantPrice.
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

    // Motherboard filtering (index 2) based on CPU (index 1)
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

    // Memory filtering (index 3) based on Motherboards (index 2)
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

    // CASE filtering based on selected motherboard form factor.
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

    // PSU filtering (index 7) based on the GPU's recommendation.
    if (CATEGORIES[currentStep].name === 'PSU' && selectedItems[0]) {
      const recommendedWattage = extractRecommendedPSUWattage(selectedItems[0]);
      items = items.filter(
        (item) => extractPSUWattage(item) >= recommendedWattage,
      );
    }

    // STORAGE filtering: remove items with the tag "Internal HDD Storage"
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
    // For MEMORY and STORAGE, initialize quantity if not set.
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
    if (currentStep < CATEGORIES.length - 1) {
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

  // Compute final approximate total price.
  const totalPrice = Object.values(selectedItems).reduce((total, item) => {
    const qty = item.quantity || 1;
    return total + item.price * qty;
  }, 0);

  // Build a human-friendly WhatsApp message.
  // Each selected item is on its own line as a bullet point with bold category.
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
      {/* Sidebar */}
      {/* <img
        className="pcBldr-background"
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/9331.jpg?v=1742467838"
        alt=""
      /> */}
      {/* <video className="pcBldr-background" autoPlay muted loop playsInline>
        <source
          src="https://cdn.shopify.com/videos/c/o/v/8e369b8ab9364a88a15c1f48fdbe4c43.mp4"
          type="video/mp4"
        />
      </video> */}

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
        {/* Left panel: filters and item list */}
        <section className="pcBldr-filtersSection">
          {/* <h3>Select {CATEGORIES[currentStep].name}</h3>
          <div className="pcBldr-filters">
            <label>
              <input
                type="text"
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                placeholder="Filter by manufacturer"
              />
            </label>
            <label className="model-input">
              <input
                type="text"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                placeholder="Filter by model"
              />
            </label>
          </div> */}
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
        </section>

        {/* Right panel: selected item details, total price, and contact button */}
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
