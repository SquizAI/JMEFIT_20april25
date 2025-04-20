import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './Navigation';
import { useCartStore } from '../store/cart';

// Mock the cart store
vi.mock('../store/cart', () => ({
  useCartStore: vi.fn(() => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    total: 0
  }))
}));

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Test desktop navigation
    const desktopNav = screen.getAllByRole('navigation')[0];
    expect(desktopNav).toBeInTheDocument();
    expect(desktopNav.querySelector('a[href="/"]')).toHaveTextContent('Home');
    expect(desktopNav.querySelector('a[href="/programs"]')).toHaveTextContent('Programs');
    expect(desktopNav.querySelector('a[href="/monthly-app"]')).toHaveTextContent('Monthly App');
    expect(desktopNav.querySelector('a[href="/community"]')).toHaveTextContent('Community');
    expect(desktopNav.querySelector('a[href="/blog"]')).toHaveTextContent('Blog');
  });

  it('displays logo', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const logo = screen.getByAltText('JMEFit Training');
    expect(logo).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const instagramLinks = screen.getAllByRole('link', { name: /instagram/i });
    const facebookLinks = screen.getAllByRole('link', { name: /facebook/i });

    expect(instagramLinks[0]).toHaveAttribute('href', 'https://instagram.com/jmefit');
    expect(facebookLinks[0]).toHaveAttribute('href', 'https://facebook.com/jmefit');
  });

  it('shows mobile menu when hamburger button is clicked', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);

    const mobileNav = screen.getByRole('navigation');
    expect(mobileNav).toHaveClass('opacity-100');
  });

  it('shows cart dropdown when cart button is clicked', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const cartButton = screen.getByRole('button', { name: /shopping cart/i });
    fireEvent.click(cartButton);

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  it('displays cart badge when items are present', () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [{ id: '1', name: 'Test Item', price: 10, description: 'Test' }],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      total: 10
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-jme-purple');
  });
});