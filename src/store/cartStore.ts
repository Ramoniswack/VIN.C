import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartVariant {
  size?: string;
  color?: string;
  sku?: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  variant?: CartVariant;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: number, variant?: CartVariant) => void;
  updateQuantity: (id: number, variant: CartVariant | undefined, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addToCart: (item) => {
        const existingItem = get().items.find(i => 
          i.id === item.id && 
          i.variant?.size === item.variant?.size && 
          i.variant?.color === item.variant?.color
        );
        
        if (existingItem) {
          set({
            items: get().items.map(i =>
              i.id === item.id && 
              i.variant?.size === item.variant?.size && 
              i.variant?.color === item.variant?.color
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          });
        } else {
          set({
            items: [...get().items, { ...item, quantity: item.quantity || 1 }]
          });
        }
      },
      
      removeFromCart: (id, variant) => {
        set({
          items: get().items.filter(item => 
            !(item.id === id && 
              item.variant?.size === variant?.size && 
              item.variant?.color === variant?.color)
          )
        });
      },
      
      updateQuantity: (id, variant, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id, variant);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id && 
            item.variant?.size === variant?.size && 
            item.variant?.color === variant?.color
              ? { ...item, quantity } 
              : item
          )
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      setIsOpen: (isOpen) => {
        set({ isOpen });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'vinc-cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);