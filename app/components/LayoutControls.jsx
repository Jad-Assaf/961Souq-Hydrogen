import React from "react";

export default function LayoutControls({ numberInRow, screenWidth, handleLayoutChange }) {
    return (
        <div className="layout-controls">
            <span className="number-sort">View As:</span>
            {screenWidth >= 300 && (
                <button
                    className={`layout-buttons first-btn ${numberInRow === 1 ? "active" : ""}`}
                    onClick={() => handleLayoutChange(1)}
                >
                    <svg /* SVG content for layout icon */ />
                </button>
            )}
            {screenWidth >= 300 && (
                <button
                    className={`layout-buttons ${numberInRow === 2 ? "active" : ""}`}
                    onClick={() => handleLayoutChange(2)}
                >
                    <svg /* SVG content for layout icon */ />
                </button>
            )}
            {screenWidth >= 550 && (
                <button
                    className={`layout-buttons ${numberInRow === 3 ? "active" : ""}`}
                    onClick={() => handleLayoutChange(3)}
                >
                    <svg /* SVG content for layout icon */ />
                </button>
            )}
            {screenWidth >= 1200 && (
                <button
                    className={`layout-buttons ${numberInRow === 4 ? "active" : ""}`}
                    onClick={() => handleLayoutChange(4)}
                >
                    <svg /* SVG content for layout icon */ />
                </button>
            )}
            {screenWidth >= 1500 && (
                <button
                    className={`layout-buttons ${numberInRow === 5 ? "active" : ""}`}
                    onClick={() => handleLayoutChange(5)}
                >
                    <svg /* SVG content for layout icon */ />
                </button>
            )}
        </div>
    );
}
