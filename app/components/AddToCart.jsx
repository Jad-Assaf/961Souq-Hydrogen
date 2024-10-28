import React from 'react';

function AddToCartButton({ variantId }) {
    const handleAddToCart = () => {
        const formData = {
            items: [{
                id: variantId,
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
            .then(response => response.json())
            .then(data => {
                console.log('Item added to cart:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    return (
        <button onClick={handleAddToCart}>Add to Cart</button>
    );
}

export default AddToCartButton;