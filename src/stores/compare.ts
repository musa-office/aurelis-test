// ============================================================
//  Compare store (nanostores) — client-side only. Tracks up to
//  4 products for side-by-side comparison. Backed by localStorage
//  so the selection survives page navigation.
// ============================================================
import { atom } from 'nanostores';

export interface CompareItem {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: string | null;
  vendor?: string | null;
}

const STORAGE_KEY = 'omnix:compare';
const MAX = 4;

export const $compare = atom<CompareItem[]>([]);
export const $compareOpen = atom<boolean>(false);

let hydrated = false;

export function initCompare(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) $compare.set(JSON.parse(raw) as CompareItem[]);
  } catch {
    /* corrupt / absent — start empty */
  }
}

function persist(items: CompareItem[]): void {
  $compare.set(items);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable */
  }
}

export function isCompared(id: string): boolean {
  return $compare.get().some((i) => i.id === id);
}

export function addCompare(item: CompareItem): void {
  if (isCompared(item.id) || $compare.get().length >= MAX) return;
  persist([...$compare.get(), item]);
}

export function removeCompare(id: string): void {
  persist($compare.get().filter((i) => i.id !== id));
}

/** Adds if absent (and below max), removes if present. Returns new compared state. */
export function toggleCompare(item: CompareItem): boolean {
  if (isCompared(item.id)) {
    removeCompare(item.id);
    return false;
  }
  if ($compare.get().length >= MAX) return false;
  addCompare(item);
  return true;
}

export function clearCompare(): void {
  persist([]);
}

export function openCompare(): void {
  $compareOpen.set(true);
}

export function closeCompare(): void {
  $compareOpen.set(false);
}
