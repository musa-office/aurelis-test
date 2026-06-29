// ============================================================
//  SearchOverlay — Aurelis full-screen search. Mounted once,
//  globally; opened from the header search button via the ui
//  store. Submitting (or Enter) navigates to the /search results
//  page. Skinned with the original Aurelis markup + classes.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $searchOpen, closeSearch, lockScroll, unlockScroll } from '~/stores/ui';

const HINTS = ['Laptops', 'Headphones', 'Smartphones', 'Smartwatch', 'Cameras', 'Earbuds'];

export default function SearchOverlay() {
  const open = useStore($searchOpen);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSearch();
    document.addEventListener('keydown', onKey);
    lockScroll();
    // Autofocus the field once the overlay is visible.
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      clearTimeout(t);
    };
  }, [open]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  return (
    <div
      className={`search-overlay${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      aria-hidden={!open}
    >
      <button className="search-close-btn" onClick={closeSearch} aria-label="Close search">
        ✕
      </button>
      <div className="search-box">
        <span className="search-label">What are you looking for?</span>
        <form className="search-row" onSubmit={submit}>
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder="Search products, brands…"
            autoComplete="off"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-submit" type="submit" aria-label="Submit search">
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <div className="search-hints">
          {HINTS.map((h) => (
            <button key={h} className="search-hint" type="button" onClick={() => { setQuery(h); inputRef.current?.focus(); }}>
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
