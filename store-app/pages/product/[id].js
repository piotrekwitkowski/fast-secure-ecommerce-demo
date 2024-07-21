import Layout from './../components/Layout';
import Image from 'next/image'
import { addItem } from '../../utils/cart';
import { useRouter } from 'next/router';
import { isLoggedIn, getUsername } from '../../utils/auth';
import { useState, useEffect } from 'react';

export default function Product({ product, comments }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    comment: '',
    pid: product.id,
    username: '',
  });

  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  function addItemToCart(id, price) {
    addItem(id, price);
    router.push('/');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    function setError(err) {
      document.getElementById("error").innerHTML = err;
    }

    try {
      formData.username = getUsername();
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      

      if (response.ok) {
        //router.reload(); // reload the page
        document.getElementById("submit").innerHTML = "Comment submmitted, thank you!";
      } else {
        // Registration failed
        if ((response.status === 405) || (response.status === 202)) {
          // reload the page to display the captcha or challenge
          router.reload()
        } else if (response.status === 403) {
          setError('comment was not authorized and blocked');
        } else {
          const data = await response.json();
          setError(data.message || 'posting comment failed');
        }
        
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.log('Registration error:', err);
    }

  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };



  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <Image src={product.image} alt={product.name} className="w-full h-full object-cover" width={640} height={640} />
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-bold text-green-600 mb-4">${product.price}</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300" onClick={() => { addItemToCart(product) }}>
            Add to Cart
          </button>
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">Comments</h1>
          {comments.map((comment) => (
            <div className="bg-grey rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 gap-6">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{comment.username}</h2>
                <p className="text-gray-600 mb-4">{comment.comment}</p>
              </div>
            </div>
          ))}
          {isAuthenticated ?
            (
              <div id='submit' className="p-6">
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                  <h1 className="text-2xl font-bold mb-6 text-center">Add comment</h1>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
                      Comment
                    </label>
                    <textarea
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                    >
                      Submit
                    </button>
                  </div>

                </form>
                <div id='error' className="flex items-center justify-between text-red-500"/>
              </div>
            ) : (
              <p className="text-gray-600 mb-4"><br></br>Login to add comments</p>
            )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const res = await fetch(`http://localhost:3000/api/product?id=${params.id}`); //TODO
  const product = await res.json();

  const comments = [
    {
      "username": "big_fellow",
      "comment": "awesome product!"
    },
    {
      "username": "joud",
      "comment": "good price foe the quality"
    },
  ]

  return {
    props: {
      product, comments
    },
  };
}
