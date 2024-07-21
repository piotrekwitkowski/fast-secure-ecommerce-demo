// Client-side authentication check
export function addItem(product) {
    if (typeof window !== 'undefined') {
      var cartItems = getCartItems();
      cartItems.push(product)
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return ;
    }
  }
  
  // Client-side get cart items
  export function getCartItems() {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('cartItems')) || [];
    }
    return '';
  }
  
  // Client-side remove cart items
  export function deleteCartItems() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cartItems');
    }
    return;
  }
  
  // Client-side get cart items
  export function getCartCount() {
    if (typeof window !== 'undefined') {
      const items = getCartItems();
      return items.length===0? '': `(${items.length})`;
    }
    return '';
  }
  
  