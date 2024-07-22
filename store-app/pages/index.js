import Layout from './components/Layout';
import Link from 'next/link';
import Image from 'next/image'
import Script from 'next/script'

export default function Home({ products }) {
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
          <Link href={`/product/${product.id}`} key={product.id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
              <Image src={product.image} alt={product.name} className="w-full h-400 object-cover" width={200} height={200} loading="lazy"/>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-4">{product.description.substring(0, 60)}...</p>
                <span className="text-green-600 font-bold">${product.price}</span>
              </div>
            </div>
          </Link>
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
