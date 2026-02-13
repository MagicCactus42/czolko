import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function NotFound() {
  return (
    <Layout>
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white/10 rounded-xl p-8">
          <h2 className="text-4xl font-bold text-white mb-4">404</h2>
          <p className="text-purple-200 mb-6">Page not found</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
