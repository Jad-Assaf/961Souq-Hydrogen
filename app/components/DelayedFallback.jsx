import React, { useEffect, useState } from 'react';

export function DelayedFallback({ delay, children }) {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return show ? children : null;
}
