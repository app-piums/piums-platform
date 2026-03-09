'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchSuggestion {
  type: 'artist' | 'service' | 'category';
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchBarProps {
  onClose?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClose, autoFocus = false }) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Load recent searches from localStorage
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true);
      // TODO: Replace with real API call
      // const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      // const data = await response.json();
      
      // Mock suggestions
      const mockSuggestions: SearchSuggestion[] = [
        { type: 'artist' as const, id: '1', name: 'DJ Carlos', subtitle: 'Música • 4.8★' },
        { type: 'artist' as const, id: '2', name: 'Fotografía María', subtitle: 'Fotografía • 4.9★' },
        { type: 'service' as const, id: '3', name: 'Cobertura de Boda', subtitle: 'Desde $15,000' },
        { type: 'category' as const, id: '4', name: 'DJ y Música', subtitle: '48 artistas' },
      ].filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to search page
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    
    setShowSuggestions(false);
    setQuery('');
    onClose?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'artist') {
      router.push(`/artists/${suggestion.id}`);
    } else if (suggestion.type === 'service') {
      router.push(`/search?serviceId=${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      router.push(`/artists?category=${suggestion.name}`);
    }
    setShowSuggestions(false);
    setQuery('');
    onClose?.();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'artist':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'service':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'category':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar artistas, servicios, categorías..."
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length > 0 || recentSearches.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Búsquedas recientes</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Limpiar
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full flex items-center px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                >
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {query.length > 0 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Sugerencias</span>
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                >
                  <div className="mr-3">
                    {getIconForType(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                    {suggestion.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{suggestion.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length > 2 && suggestions.length === 0 && !loading && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
              <button
                onClick={() => handleSearch(query)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Buscar "{query}"
              </button>
            </div>
          )}

          {/* Popular Searches */}
          {query.length === 0 && recentSearches.length === 0 && (
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Búsquedas populares</p>
              <div className="flex flex-wrap gap-2">
                {['DJ', 'Fotografía', 'Catering', 'Decoración'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentSearchClick(term)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
