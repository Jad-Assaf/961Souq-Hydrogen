import CollectionSlider, { fetchCollectionsLoader } from '~/components/CollectionSlider';

// Export the loader for this route
export const loader = fetchCollectionsLoader;

// Route component
export default function SliderRoute() {
    return <CollectionSlider />;
}
