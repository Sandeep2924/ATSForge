import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the application header', () => {
    render(<App />);
    const matchingElements = screen.getAllByText(/ATSForge/i);
    expect(matchingElements.length).toBeGreaterThan(0);
    expect(matchingElements[0]).toBeInTheDocument();
  });

  it('renders the upload button', () => {
    render(<App />);
    const uploadButton = screen.getByText(/Upload Resume/i);
    expect(uploadButton).toBeInTheDocument();
  });
});
