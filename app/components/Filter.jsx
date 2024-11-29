import React from "react";

export function Filter({ label, options, selectedOptions, onChange }) {
    const handleOptionChange = (option) => {
        const updatedOptions = selectedOptions.includes(option)
            ? selectedOptions.filter((opt) => opt !== option)
            : [...selectedOptions, option];
        onChange(updatedOptions);
    };

    return (
        <div className="filter">
            <h4>{label}</h4>
            {options.map((option) => (
                <label key={option}>
                    <input
                        type="checkbox"
                        value={option}
                        checked={selectedOptions.includes(option)}
                        onChange={() => handleOptionChange(option)}
                    />
                    {option}
                </label>
            ))}
        </div>
    );
}
