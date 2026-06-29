// ============================================================
//  ProductGallery — PDP thumbnails + main stage. Client island so
//  selecting a thumb swaps the stage image. Skinned with the
//  original Aurelis gallery markup + classes.
// ============================================================
import { useState, useEffect } from 'react';
import type { Image } from '~/lib/shopify/types';

interface Props {
  images: Image[];
  title: string;
}

export default function ProductGallery({ images, title }: Props) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const pad = (n: number) => String(n).padStart(2, '0');

  // When a variant is selected in the buy-box island, swap the stage to that
  // variant's image (matched by id, then by url ignoring size params).
  useEffect(() => {
    const stripQuery = (u?: string | null) => (u ?? '').split('?')[0];
    const onVariantImage = (e: Event) => {
      const { id, url } = (e as CustomEvent).detail ?? {};
      let found = -1;
      if (id) found = images.findIndex((im) => im.id === id);
      if (found < 0 && url) found = images.findIndex((im) => stripQuery(im.url) === stripQuery(url));
      if (found >= 0) setIdx(found);
    };
    window.addEventListener('pdp:variant-image', onVariantImage);
    return () => window.removeEventListener('pdp:variant-image', onVariantImage);
  }, [images]);

  if (total === 0) {
    return (
      <div className="pdp-gallery">
        <div className="gallery-stage" />
      </div>
    );
  }

  return (
    <div className="pdp-gallery">
      <div className="gallery-thumbs" id="gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={img.url}
            className={`thumb-item${i === idx ? ' is-active' : ''}`}
            data-idx={i}
            onClick={() => setIdx(i)}
            aria-label={`View image ${i + 1}`}
          >
            <img src={img.url} alt={img.altText ?? ''} loading="lazy" />
          </button>
        ))}
      </div>

      <div className="gallery-stage" id="gallery-stage">
        {images.map((img, i) => (
          <div key={img.url} className={`stage-slide${i === idx ? ' is-active' : ''}`} data-idx={i}>
            <img src={img.url} alt={img.altText ?? `${title} — image ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
        {total > 1 && (
          <div className="stage-counter">
            <b id="stage-current">{pad(idx + 1)}</b> / {pad(total)}
          </div>
        )}
      </div>
    </div>
  );
}
