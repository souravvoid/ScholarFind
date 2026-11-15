import { useState } from 'react';
import { Icon } from './Icon';

interface ScholarshipImageProps {
  src?: string;
  /** Decorative by default: the scholarship title sits beside the image. */
  alt?: string;
  className?: string;
}

/**
 * Scholarship hero image with a graceful placeholder. Provider image URLs can
 * expire or be missing, so a failed load must never leave a broken-image icon
 * in the catalogue.
 */
export function ScholarshipImage({ src, alt = '', className = '' }: ScholarshipImageProps) {
  const [failed, setFailed] = useState(false);
  // Only render images from https: URLs to prevent injection of javascript:/data: URIs
  const safeSrc = src && /^https:\/\//i.test(src) ? src : undefined;
  const showImage = Boolean(safeSrc) && !failed;

  return (
    <div className={`relative overflow-hidden bg-paper-sunken ${className}`}>
      {showImage ? (
        <img
          src={safeSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ECE7F7] to-paper-sunken text-sapphire/60">
          <Icon name="degree" size={22} />
        </div>
      )}
    </div>
  );
}
