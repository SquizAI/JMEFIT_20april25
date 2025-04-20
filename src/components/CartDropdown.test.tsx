import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartDropdown from './CartDropdown';
import { useCartStore } from '../store/cart';

// Mock the cart store
vi.mock('../store/cart', () => ({
  useCartStore: vi.fn(() => ({
    items: [],
    removeItem: vi.fn(),
    total: 0
  }))
}));

describe('CartDropdown', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <BrowserRouter>
        <CartDropdown isOpen={false} onClose={() => {}} />
      </BrowserRouter>
    );
    
    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument();
  });

  it('renders empty cart message when no items', () => {
    render(
      <BrowserRouter>
        <CartDropdown isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders cart items when present', () => {
    const mockItems = [
      { id: '1', name: 'Test Program', description: 'Test Description', price: 99.99 }
    ];
    
    vi.mocked(useCartStore).mockReturnValue({
      items: mockItems,
      removeItem: vi.fn(),
      total: 99.99
    });

    render(
      <BrowserRouter>
        <CartDropdown isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Program')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <BrowserRouter>
        <CartDropdown isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls removeItem when remove button is clicked', () => {
    const removeItem = vi.fn();
    const mockItems = [
      { id: '1', name: 'Test Program', description: 'Test Description', price: 99.99 }
    ];
    
    vi.mocked(useCartStore).mockReturnValue({
      items: mockItems,
      removeItem,
      total: 99.99
    });

    render(
      <BrowserRouter>
        <CartDropdown isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(removeItem).toHaveBeenCalledWith('1');
  });

  it('displays correct total price', () => {
    const mockItems = [
      { id: '1', name: 'Program 1', description: 'Description 1', price: 99.99 },
      { id: '2', name: 'Program 2', description: 'Description 2', price: 149.99 }
    ];
    
    vi.mocked(useCartStore).mockReturnValue({
      items: mockItems,
      removeItem: vi.fn(),
      total: 249.98
    });

    render(
      <BrowserRouter>
        <CartDropdown isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('$249.98')).toBeInTheDocument();
  });
});