import React from "react";

export function ProductMetafields({ metafieldCondition, metafieldWarranty, metafieldShipping, metafieldVat }) {
    return (
        <div className="product-metafields">
            <h3>Product Details</h3>
            <ul>
                <li>
                    <strong>Condition:</strong> {metafieldCondition?.value || 'Not available'}
                </li>
                <li>
                    <strong>Warranty:</strong> {metafieldWarranty?.value || 'Not available'}
                </li>
                <li>
                    <strong>Shipping:</strong> {metafieldShipping?.value || 'Not available'}
                </li>
                <li>
                    <strong>VAT:</strong> {metafieldVat?.value || 'Not available'}
                </li>
            </ul>
        </div>
    );
}
