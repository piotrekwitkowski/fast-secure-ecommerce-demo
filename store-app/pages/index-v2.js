import Layout from './components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { addItem } from '../utils/cart';
import { useRouter } from 'next/router';
import { isLoggedIn } from '../utils/auth';
import { useState, useEffect } from 'react';

export default function Home({ products }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  function addItemToCart(id, price) {
    addItem(id, price);
    router.reload();
  }

  return (
    <Layout>
      <Script type="speculationrules" id="speculationAPI" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "prerender": [
            {
              "source": "document",
              "where": { "href_matches": "/product/*" },
              "eagerness": "moderate"
            }
          ]
        })
      }}>
      </Script>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white">
            <Link href={`/product/${product.id}`} key={product.id}>
              <Image src={product.image} alt={product.name} className="w-full h-400 object-cover" width={200} height={200} loading="lazy" />
              <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">{product.name}</div>
                <p className="text-gray-700 text-base">{product.description.substring(0, 60)}...</p>
              </div>
            </Link>
            <div className="px-6 pt-4 pb-2 flex justify-between items-center">
              <span className="text-xl font-bold text-green-600">${product.price}</span>
              <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center" onClick={() => { addItemToCart(product) }}>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {

  const res = await fetch('http://localhost:3000/api/products'); //TODO

  const products = await res.json();

  return {
    props: {
      products,
    },
  };
}
