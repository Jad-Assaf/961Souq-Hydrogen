import React, {useState, useMemo, useEffect} from 'react';
import {useLoaderData, useFetcher} from '@remix-run/react';
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

// Desired order: GPU, CPU, MB, MEMORY, CASE, COOLING, STORAGE, PSU.
const CATEGORY_ORDER = [
  'GPU',
  'CPU',
  'MB',
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
  MB: 'motherboards',
  CASE: 'cases',
  COOLING: 'cpu-coolers',
  MEMORY: 'ram',
  STORAGE: 'internal-storage',
  PSU: 'power-supply',
};

// Build the list of categories from the ordered list.
const CATEGORIES = CATEGORY_ORDER.map((name) => ({name}));

// --- PSU Recommendation Helpers ---

// Extract recommended PSU wattage from a GPU's description.
// Assumes the GPU description contains a pattern like "750W" or "750 Watt".
function extractRecommendedPSUWattage(gpu) {
  if (!gpu || !gpu.description) return 0;
  const match = gpu.description.match(/(\d+)\s*(W|watt)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// Extract the wattage from a PSU product.
// Checks the product's model first, then its description.
function extractPSUWattage(psu) {
  if (!psu) return 0;
  let wattage = 0;
  // Try extracting from the model (title).
  const matchModel = psu.model.match(/(\d+)\s*(W|watt)/i);
  if (matchModel) {
    wattage = parseInt(matchModel[1], 10);
  }
  // If not found in the model, try the description.
  if (!wattage && psu.description) {
    const matchDesc = psu.description.match(/(\d+)\s*(W|watt)/i);
    wattage = matchDesc ? parseInt(matchDesc[1], 10) : 0;
  }
  return wattage;
}

// --- End PSU Helpers ---

export async function loader({context, request}) {
  const url = new URL(request.url);
  // Default to the first category's handle.
  const handle =
    url.searchParams.get('handle') || CATEGORY_HANDLES[CATEGORIES[0].name];

  const QUERY = `
    query ProductsByCollection($handle: String!) {
      collectionByHandle(handle: $handle) {
        products(first: 250) {
          edges {
            node {
              id
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
            }
          }
        }
      }
    }
  `;

  const data = await context.storefront.query(QUERY, {variables: {handle}});

  const products =
    data.collectionByHandle?.products?.edges.map(({node: product}) => ({
      id: product.id,
      manufacturer: product.vendor,
      model: product.title, // Using title as model.
      description: product.descriptionHtml, // Rich HTML description.
      tags: product.tags || [],
      image:
        product.images.edges[0]?.node.url ||
        'https://via.placeholder.com/300?text=No+Image',
      specs: [],
    })) || [];

  return {products, currentHandle: handle};
}

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

  // Load products for the current category.
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

  // Filter products based on manufacturer, model and tag relationships.
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

    // For MB filtering (index 2) based on selected CPU (index 1):
    if (CATEGORIES[currentStep].name === 'MB' && selectedItems[1]) {
      const selectedCPU = selectedItems[1];
      const cpuTags = (selectedCPU.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => CPU_VALID_TAGS.includes(t));
      items = items.filter((item) => {
        const mbTags = (item.tags || []).map((t) => t.toLowerCase());
        return cpuTags.some((tag) => mbTags.includes(tag));
      });
    }

    // For Memory filtering (index 3) based on selected MB (index 2):
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

    // For PSU filtering (index 7) based solely on the GPU's recommendation.
    if (CATEGORIES[currentStep].name === 'PSU' && selectedItems[0]) {
      const recommendedWattage = extractRecommendedPSUWattage(selectedItems[0]);
      items = items.filter(
        (item) => extractPSUWattage(item) >= recommendedWattage,
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

  return (
    <div className="pcBldr-container">
      {/* Sidebar */}
      <div className="pcBldr-sidebar">
        <div className="pcBldr-sidebar-div">
          <h2 className="pcBldr-title">PC BUILDER</h2>
          <nav className="pcBldr-nav">
            {CATEGORIES.map((cat, index) => {
              // A category is clickable only if all previous ones are selected.
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
          <h3>Select {CATEGORIES[currentStep].name}</h3>
          <div className="pcBldr-filters">
            <label>
              Manufacturer:
              <input
                type="text"
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                placeholder="Filter by manufacturer"
              />
            </label>
            <label>
              Model:
              <input
                type="text"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                placeholder="Filter by model"
              />
            </label>
          </div>
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
                  <img
                    src={`${item.image}&quality=20`}
                    alt={item.model}
                    width={100}
                    height={100}
                  />
                  <div>{item.model}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right panel: selected item details and summary */}
        <section className="pcBldr-selectedSection">
          <h3>Selected {CATEGORIES[currentStep].name}</h3>
          {selectedItem ? (
            <div className="pcBldr-selectedDetails">
              <img
                src={`${selectedItem.image}&quality=50`}
                alt={selectedItem.model}
                style={{width: '100%', maxWidth: '300px', margin: 'auto'}}
                width={200}
                height={200}
              />
              <h4>
                {selectedItem.manufacturer} {selectedItem.model}
              </h4>
              <div
                className="pcBldr-description"
                dangerouslySetInnerHTML={{__html: selectedItem.description}}
              />
              <ul>
                {selectedItem.specs.map((spec, idx) => (
                  <li key={idx}>{spec}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No {CATEGORIES[currentStep].name} selected yet.</p>
          )}

          <div className="pcBldr-selectedSummary">
            <h4>All Selected Items</h4>
            {Object.keys(selectedItems).length === 0 ? (
              <p>No items selected yet.</p>
            ) : (
              Object.keys(selectedItems).map((catIndex) => {
                const item = selectedItems[catIndex];
                const categoryName = CATEGORIES[catIndex].name;
                return (
                  <div key={catIndex} className="pcBldr-selectedSummaryItem">
                    <span>
                      {categoryName}: {item.manufacturer} {item.model}
                    </span>
                    <button onClick={() => handleRemoveItem(catIndex)}>
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
