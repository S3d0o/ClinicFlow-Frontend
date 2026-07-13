import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Stethoscope, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
          <Stethoscope className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg text-slate-500 mb-8">This page doesn&apos;t exist</p>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link to="/">
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
