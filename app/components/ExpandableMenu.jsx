import React, { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "@remix-run/react";
import { Image } from "@shopify/hydrogen-react";
import "../styles/CollectionSlider.css";

export const ExpandableMenu = ({ menuItems }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [collapsingCategory, setCollapsingCategory] = useState(null);

    const handleCategoryClick = (id) => {
        if (expandedCategory === id) {
            // Collapse currently expanded category
            setCollapsingCategory(id);
            setTimeout(() => {
                setCollapsingCategory(null);
                setExpandedCategory(null);
            }, 500); // Match the collapse animation duration
        } else {
            // Expand new category
            setCollapsingCategory(null);
            setExpandedCategory(id);
        }
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {menuItems.map((item, index) => (
                    <ExpandableMenuItem
                        key={item.id}
                        item={item}
                        index={index}
                        isExpanded={expandedCategory === item.id}
                        isCollapsing={collapsingCategory === item.id}
                        onCategoryClick={handleCategoryClick}
                    />
                ))}
            </div>
        </div>
    );
};

const ExpandableMenuItem = ({ item, index, isExpanded, isCollapsing, onCategoryClick }) => {
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const isInView = useInView(containerRef, { once: true });
    const hasSubItems = item.items && item.items.length > 0;

    // Function to dynamically adjust styles for specific items on mobile
    const handleMobileDropdownPosition = () => {
        if (!dropdownRef.current || window.innerWidth > 768) return; // Only on mobile

        const dropdown = dropdownRef.current;

        // Reset styles
        dropdown.style.left = "auto";
        dropdown.style.transform = "none";

        // Adjust based on index
        if ([0, 3, 6, 9].includes(index)) {
            // First, 4th, 7th, 10th: Align to the right
            dropdown.style.left = "100%";
        } else if ([2, 5, 8].includes(index)) {
            // 3rd, 6th, 9th: Align to the left
            dropdown.style.left = "-100%";
        } else if ([12].includes(index)) {
            dropdown.style.left = "50%";
        } else if ([13].includes(index)) {
            dropdown.style.left = "-50%";
        } else {
            // Others: Default alignment
            dropdown.style.left = "0";
        }
    };

    useEffect(() => {
        if (isExpanded) {
            handleMobileDropdownPosition();
        }
    }, [isExpanded]);

    const handleClick = (e) => {
        if (hasSubItems) {
            e.preventDefault();
            onCategoryClick(item.id);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`category-item 
                ${isExpanded ? "expanded" : ""} 
                ${isCollapsing ? "collapsing" : ""}`}
        >
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                className="category-container"
            >
                {hasSubItems ? (
                    <div onClick={handleClick} className="category-link">
                        <ExpandableMenuContent item={item} isInView={isInView} />
                    </div>
                ) : (
                    <Link to={item.url} className="category-link">
                        <ExpandableMenuContent item={item} isInView={isInView} />
                    </Link>
                )}
            </motion.div>
            {hasSubItems && (
                <div
                    ref={dropdownRef}
                    className={`subcategory-list 
                        ${isExpanded ? "expanded" : ""} 
                        ${isCollapsing ? "collapsing" : ""}`}
                >
                    {item.items.map((subItem, subIndex) => (
                        <ExpandableMenuItem
                            key={subItem.id}
                            item={subItem}
                            index={subIndex}
                            isExpanded={false}
                            isCollapsing={false}
                            onCategoryClick={() => { }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ExpandableMenuContent = ({ item, isInView }) => {
    const title = item.title;

    return (
        <>
            <motion.div
                initial={{ filter: "blur(10px)", opacity: 0 }}
                animate={isInView ? { filter: "blur(0px)", opacity: 1 } : {}}
                transition={{ duration: 0.3 }}
                className="category-image-container"
            >
                {item.image ? (
                    <Image
                        data={item.image}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 40vw"
                        alt={item.image?.altText || title}
                        className="category-image"
                        width="150px"
                        height="150px"
                    />
                ) : (
                    <div className="category-placeholder-image"></div>
                )}
            </motion.div>
            <div className="category-title">{title}</div>
        </>
    );
};
