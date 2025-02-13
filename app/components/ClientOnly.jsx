// src/components/ClientOnly.jsx
import {useEffect, useState} from 'react';

const ClientOnly = ({children}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return children;
};

export default ClientOnly;
