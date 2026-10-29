import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

interface ResourcePhotoProps {
  imageId?: string | null;
  alt: string;
  className?: string;
}

export const ResourcePhoto: React.FC<ResourcePhotoProps> = ({
  imageId,
  alt,
  className = '',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      setImageUrl(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setImageUrl(null);

    api.getBlob(`/api/images/${encodeURIComponent(imageId)}`, { signal: controller.signal })
      .then((image) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(image);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setImageUrl(null);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (!imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        role="img"
        aria-label={`${alt} unavailable`}
      >
        <ImageIcon className="h-8 w-8" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setImageUrl(null)}
    />
  );
};
