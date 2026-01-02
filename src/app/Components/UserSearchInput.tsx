'use client';

import React from 'react';

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserSearchInput({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Search users by name or username',
  disabled = false,
}: UserSearchInputProps) {
  return (
    <div className="connections-search-container">
      <svg
        className="connections-search-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="connections-search-input"
        disabled={disabled}
      />
    </div>
  );
}

