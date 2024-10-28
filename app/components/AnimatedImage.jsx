import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

function AnimatedImage({ src, alt, placeholder, ...props }) {
    return (
        <LazyLoadImage
            src={src}
            alt={alt}
            placeholderSrc={placeholder}
            effect="blur" // You can use other effects like 'opacity'
            width="100%"
            height="auto"
            {...props}
        />
    );
}