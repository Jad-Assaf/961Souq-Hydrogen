import React from 'react';

function AddToCartButton({ variantId }) {
    const handleAddToCart = () => {
        const formData = {
            items: [{
                merchandiseId: variantId,  // Use 'merchandiseId' instead of 'id'
                quantity: 1
            }]
        };

        fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Item added to cart:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return (
        <button onClick={handleAddToCart} style={{ zIndex: 99999, padding: '10px' }}>
            Add to Cart
        </button>
    );
}

export default AddToCartButton;
