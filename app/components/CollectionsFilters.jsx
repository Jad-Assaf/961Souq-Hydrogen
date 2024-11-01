import { useLocation, useNavigate } from '@remix-run/react';

export function VendorProductTypeFilter({ vendors, productTypes }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const handleVendorChange = (vendor) => {
    if (vendor) {
      searchParams.set('vendor', vendor);
    } else {
      searchParams.delete('vendor');
    }
    navigate(`?${searchParams.toString()}`);
  };

  const handleProductTypeChange = (productType) => {
    if (productType) {
      searchParams.set('productType', productType);
    } else {
      searchParams.delete('productType');
    }
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <div>
      <div>
        <h3>Filter by Vendor</h3>
        <button onClick={() => handleVendorChange(null)}>All Vendors</button>
        {vendors.map((vendor) => (
          <button
            key={vendor}
            onClick={() => handleVendorChange(vendor)}
            style={{
              fontWeight: vendor === searchParams.get('vendor') ? 'bold' : 'normal',
            }}
          >
            {vendor}
          </button>
        ))}
      </div>
      <div>
        <h3>Filter by Product Type</h3>
        <button onClick={() => handleProductTypeChange(null)}>All Types</button>
        {productTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleProductTypeChange(type)}
            style={{
              fontWeight: type === searchParams.get('productType') ? 'bold' : 'normal',
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
