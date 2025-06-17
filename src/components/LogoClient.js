'use client';

import { useEffect, useRef, useState } from 'react';

export default function LogoClient({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const currentImage = images?.[currentIndex]?.image;

  // Cycle through images every 3s
  useEffect(() => {
    if (!images || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images]);

  // When image loads, calculate width scaled to 50vh
  useEffect(() => {
    const updateWidth = () => {
      if (imgRef.current && containerRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        const vh = window.innerHeight * 0.5; // 50vh in pixels
        const scaledWidth = (naturalWidth / naturalHeight) * vh;
        setContainerWidth(scaledWidth);
      }
    };

    if (imgRef.current?.complete) {
      updateWidth(); // if cached
    } else {
      imgRef.current?.addEventListener('load', updateWidth);
      return () =>
        imgRef.current?.removeEventListener('load', updateWidth);
    }
  }, [currentIndex]);

  return (
    <div className="logo-gen-wrapper">
      <div className="logo-gen">
        <h1>Fides</h1>

        <div
          className="line-image-container"
          ref={containerRef}
          style={{
            width: containerWidth ? `${containerWidth}px` : 'auto',
          }}
        >
          {currentImage?.url && (
            <img
              ref={imgRef}
              src={currentImage.url}
              alt={currentImage.alt || 'logo divider'}
              className="line-image"
            />
          )}
        </div>

        <h1>Lapidaire</h1>
      </div>
    </div>
  );
}
