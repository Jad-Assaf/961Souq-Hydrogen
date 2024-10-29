import '../styles/MenuCollectionDisplay.css';

// components/MenuCollectionDisplay.jsx
export function MenuCollectionDisplay({ collections }) {
    if (!collections || collections.length === 0) {
        return <p>No collections available.</p>;
    }

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Featured Collections</h3>
            <div className="category-slider">
                {collections.map((collection) => (
                    <div key={collection.id} className="category-container">
                        <img
                            src={collection.image.url}
                            alt={collection.image.altText}
                            className="category-image"
                        />
                        <span className="category-title">{collection.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
