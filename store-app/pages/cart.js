import Layout from './components/Layout';
import Image from 'next/image'
import { getCartItems, deleteCartItems } from '../utils/cart';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isLoggedIn, getUsername } from '../utils/auth';


export default function Cart() {

  const [cartItems, setCartItems] = useState(null);
  const [totalPrice, setTotalPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchItems() {
      try {
        const items = getCartItems();
        setCartItems(items);
        var price = 0;
        items.map((item) => (price += item.price));
        setTotalPrice(price);

      } catch (err) {
        setError('Failed to load items. Please try again.');
        console.error('Items fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }


    fetchItems();
  }, [router]);

  if (isLoading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const username = getUsername();

  if (!cartItems || (cartItems.length === 0)) {
    if (orderPlaced) {
      return <Layout>
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
          <div class="flex items-center p-6 rounded-lg ">
            <Image src="images/full-cart.jpeg" className="w-36 h-36 mr-6" width={200} height={200} />
            <div>
              <h2 class="font-sans text-2xl font-bold text-gray-800 mb-2">{username}, thanks for your order :)</h2>
              <p class="font-sans text-lg text-gray-600">Your shipment is on the way!</p>
            </div>
          </div>
        </div>
      </Layout>;
    } else {
      return <Layout>
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
          <div className="flex items-center p-6 rounded-lg ">
            <Image src="images/empty-cart.jpeg" className="w-36 h-36 mr-6" width={200} height={200} />
            <div>
              <h2 className="font-sans text-2xl font-bold text-gray-800 mb-2">{(username != '') ? username + ', your' : 'Your'} cart is empty :(</h2>
              <p className="font-sans text-lg text-gray-600">Please add some stuff to it!</p>
            </div>
          </div>
        </div>
      </Layout>;
    }

  }

  if (error) {
    return <Layout><div className="text-red-500">{error}</div></Layout>;
  }

  async function purchase() {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    deleteCartItems();
    setCartItems();
    setOrderPlaced(true);
    setTimeout(() => router.push('/'), 4000);
  }


return (
  <Layout>
    { /*<h1 className="text-3xl font-bold mb-6">Products</h1>*/}
    <div className="grid grid-cols-1 gap-2">
      {cartItems.map((product) => (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
          <div className="p-4 flex flex-row justify-between">
            <Image src={product.image} alt={product.name} className="object-cover" width={64} height={64} />
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <span className="text-green-600 font-bold">${product.price}</span>
          </div>
        </div>
      ))}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
        <div className="p-4 flex flex-row justify-between">
          <h2 className="text-xl font-semibold mb-2">Total</h2>
          <span className="text-green-600 font-bold">${totalPrice}</span>
        </div>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300" onClick={() => { purchase() }}>
          Order now
        </button>
      </div>
    </div>
  </Layout>
);
}
