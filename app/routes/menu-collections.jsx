// app/routes/menu-collections.jsx
import { MenuCollectionDisplay, loader as menuLoader } from '~/components/MenuCollectionDisplay';

export const loader = menuLoader;

export default function MenuCollectionsRoute() {
    return <MenuCollectionDisplay />;
}
