import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavLink } from '../shared/components/NavLink';
import { describe, it, expect } from 'vitest';

describe('NavLink Component', () => {
  it('renders correctly with content', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );

    const linkElement = screen.getByText('Test Link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.getAttribute('href')).toBe('/test');
  });

  it('applies active class name when active', () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <NavLink to="/test" activeClassName="custom-active">
          Test Link
        </NavLink>
      </MemoryRouter>
    );

    const linkElement = screen.getByText('Test Link');
    expect(linkElement.className).toContain('custom-active');
  });
});
