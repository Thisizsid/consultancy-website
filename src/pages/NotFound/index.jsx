import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 text-text-secondary max-w-md">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="mt-8">
        <Button icon={Home}>Back to homepage</Button>
      </Link>
    </div>
  );
};

export default NotFound;
