// routes/slider.jsx
import { fetchCollectionsLoader } from '~/components/CollectionSlider';
import CollectionSlider from '~/components/CollectionSlider';

// Export the loader to be used by this route
export const loader = fetchCollectionsLoader;

// Define the component to render
export default function SliderRoute() {
    return <CollectionSlider />;
}
