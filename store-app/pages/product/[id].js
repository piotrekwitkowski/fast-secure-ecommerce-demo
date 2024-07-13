import Layout from './../components/Layout';
import Image from 'next/image'
import { addItem } from '../../utils/cart';
import { useRouter } from 'next/router';

export default function Product({ product }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  function addItemToCart(id, price) {
    addItem(id, price);
    router.push('/');
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <Image src={product.image} alt={product.name} className="w-full h-full object-cover" layout="responsive" width={640} height={640} />
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-bold text-green-600 mb-4">${product.price}</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300" onClick={() => {addItemToCart(product)}}>
            Add to Cart
          </button>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const res = await fetch(`http://localhost:3000/api/product?id=${params.id}`); //TODO
  const product = await res.json();

  return {
    props: {
        product,
    },
  };
}