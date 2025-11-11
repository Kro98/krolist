import { useState, useEffect } from 'react';

export const useImageZoom = () => {
  const [isZoomEnabled, setIsZoomEnabled] = useState(() => {
    const saved = localStorage.getItem('imageZoomEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('imageZoomEnabled', isZoomEnabled.toString());
  }, [isZoomEnabled]);

  return { isZoomEnabled, setIsZoomEnabled };
};
