'use client';

import React from 'react';
import YARLightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

interface LightboxComponentProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Array<{ src: string; alt?: string; title?: string; description?: string }>;
  index: number;
}

export const LightboxComponent: React.FC<LightboxComponentProps> = ({
  isOpen,
  onClose,
  slides,
  index,
}) => {
  return (
    <YARLightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Zoom, Counter]}
      carousel={{
        finite: slides.length <= 1,
      }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : undefined,
        buttonNext: slides.length <= 1 ? () => null : undefined,
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      counter={{
        container: { style: { top: 'unset', bottom: 0 } },
      }}
    />
  );
};

// Keep backward compatibility with old Lightbox component
interface LegacyLightboxProps {
  images: Array<{ url: string; title?: string; description?: string }>;
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Lightbox: React.FC<LegacyLightboxProps> = ({
  images,
  currentIndex,
  onClose,
}) => {
  const slides = images.map(img => ({
    src: img.url,
    alt: img.title || 'Image',
    title: img.title,
    description: img.description,
  }));

  return (
    <LightboxComponent
      isOpen={true}
      onClose={onClose}
      slides={slides}
      index={currentIndex}
    />
  );
};
