import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the application header and upload button', () => {
    render(<App />);
    const matchingElements = screen.getAllByText(/ATSForge/i);
    expect(matchingElements.length).toBeGreaterThan(0);
    expect(matchingElements[0]).toBeInTheDocument();

    const uploadButton = screen.getByText(/Upload Resume/i);
    expect(uploadButton).toBeInTheDocument();
  });

  it('ensures Items 1, 2, and 3 are completely removed per user request', () => {
    render(<App />);
    // Item 1: Dark Mode toggle
    expect(screen.queryByTitle(/Switch to Dark Mode/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Switch to Light Mode/i)).not.toBeInTheDocument();

    // Item 2: Cookie banner
    expect(screen.queryByText(/cookie/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/We store your resume locally/i)).not.toBeInTheDocument();

    // Item 3: Quick section jump bar
    expect(screen.queryByRole('navigation', { name: /Quick section navigation/i })).not.toBeInTheDocument();
  });

  it('verifies essential retained features (4 through 20) are present in DOM', () => {
    render(<App />);

    // Item 4: Back to top button
    expect(screen.getByTitle(/Scroll back to top of editor/i)).toBeInTheDocument();

    // Item 5: Mobile switcher tabs
    expect(screen.getByRole('tab', { name: /Editor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Preview/i })).toBeInTheDocument();

    // Item 9: Copy buttons
    expect(screen.getByTitle(/Copy complete LaTeX code/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Copy formatted plain text/i)).toBeInTheDocument();

    // Item 12: Skip to content
    expect(screen.getByText(/Skip to editor content/i)).toBeInTheDocument();

    // Item 13 & 17: Settings modal trigger
    expect(screen.getByTitle(/Settings, Custom API Key & Reset/i)).toBeInTheDocument();

    // Item 18: Last updated indicator
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();

    // Item 19: FAQ modal trigger
    expect(screen.getByTitle(/Frequently Asked Questions & Help/i)).toBeInTheDocument();

    // Item 20: Floating feedback button
    expect(screen.getByTitle(/Report an issue or suggest a feature on GitHub/i)).toBeInTheDocument();
  });
});

