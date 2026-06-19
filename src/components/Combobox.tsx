import React, { useState, useEffect, useRef, useMemo } from 'react';
export interface Category {
  id: string;
  name: string;
}
import { Search, Plus, Check, ChevronDown } from 'lucide-react';

const COLORS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];

export const getCategoryColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  const color = COLORS[index];
  return {
    bg: `bg-notion-tag-${color}-bg`,
    text: `text-notion-tag-${color}-text`,
    colorName: color
  };
};

interface ComboboxProps {
  categories: Category[];
  selectedCategoryId: string;
  onChange: (categoryId: string) => void;
  onCreateCategory: (name: string) => Promise<Category>;
  placeholder?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  categories,
  selectedCategoryId,
  onChange,
  onCreateCategory,
  placeholder = 'Select option...'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Filter categories by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const exactMatchExists = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.some(c => c.name.toLowerCase() === query);
  }, [categories, search]);

  // Total selectable items in the dropdown list (filtered categories + option to create)
  const totalItems = useMemo(() => {
    let count = filtered.length;
    if (search.trim() && !exactMatchExists) {
      count += 1; // "+ Create category" item at the end
    }
    return count;
  }, [filtered, search, exactMatchExists]);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleCreate = async () => {
    const query = search.trim();
    if (!query || isCreating) return;

    setIsCreating(true);
    try {
      const newCat = await onCreateCategory(query);
      onChange(newCat.id);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex < filtered.length) {
          // Select existing
          handleSelect(filtered[activeIndex].id);
        } else if (search.trim() && !exactMatchExists) {
          // Create new
          await handleCreate();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const selectedCol = selectedCategory ? getCategoryColor(selectedCategory.name) : null;

  return (
    <div ref={containerRef} className="relative w-full text-left font-sans">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[38px] px-3 py-1.5 flex items-center justify-between border border-notion-border rounded-md bg-white hover:bg-notion-hover active:bg-notion-active transition-colors duration-100 text-sm outline-none cursor-pointer focus:border-notion-text"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedCategory ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide leading-relaxed ${selectedCol?.bg} ${selectedCol?.text}`}>
            {selectedCategory.name}
          </span>
        ) : (
          <span className="text-notion-muted">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-notion-muted ml-2 flex-shrink-0" />
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-notion-border rounded-lg shadow-lg overflow-hidden animate-pop">
          {/* Search Input Bar */}
          <div className="flex items-center px-3 py-2 border-b border-notion-border">
            <Search className="w-4 h-4 text-notion-muted mr-2 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or create a category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-sm bg-transparent outline-none border-none text-notion-text placeholder-notion-muted"
            />
          </div>

          {/* List Section */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {filtered.map((cat, index) => {
              const isSelected = cat.id === selectedCategoryId;
              const isHighlighted = index === activeIndex;
              const col = getCategoryColor(cat.name);

              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                  data-active={isHighlighted}
                  className={`px-3 py-1.5 flex items-center justify-between text-sm cursor-pointer transition-colors duration-75 ${
                    isHighlighted ? 'bg-notion-hover' : ''
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${col.bg} ${col.text}`}>
                    {cat.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-notion-text flex-shrink-0" />}
                </div>
              );
            })}

            {/* Create inline button */}
            {search.trim() && !exactMatchExists && (
              <div
                onClick={handleCreate}
                onMouseEnter={() => setActiveIndex(filtered.length)}
                data-active={activeIndex === filtered.length}
                className={`px-3 py-2 flex items-center text-sm cursor-pointer text-notion-text font-medium border-t border-notion-border transition-colors duration-75 ${
                  activeIndex === filtered.length ? 'bg-notion-hover' : ''
                }`}
                role="option"
              >
                <Plus className="w-4 h-4 text-notion-muted mr-2 flex-shrink-0" />
                <span className="truncate">
                  {isCreating ? 'Creating...' : `Create category "${search.trim()}"`}
                </span>
              </div>
            )}

            {filtered.length === 0 && !search.trim() && (
              <div className="px-3 py-6 text-center text-xs text-notion-muted">
                No categories found. Type to create one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
