import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stethoscope, CheckCircle, XCircle } from 'lucide-react';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const called = useRef(false);

useEffect(() => {
  if (called.current) return;
  called.current = true;

  if (!userId || !token) {
    setStatus('error');
    return;
  }
  authApi
    .confirmEmail({ userId, token })
    .then(() => setStatus('success'))
    .catch(() => setStatus('error'));
}, [userId, token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">ClinicFlow</span>
        </Link>

        <Card className="border-slate-100 shadow-lg">
          <CardContent className="p-8">
            {status === 'loading' && (
              <div className="py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4" />
                <p className="text-sm text-slate-500">Confirming your email...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="py-4">
                <CheckCircle className="h-12 w-12 text-teal-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Email Confirmed!</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Your email has been verified. You can now sign in to your account.
                </p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            )}
            {status === 'error' && (
              <div className="py-4">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Confirmation Failed</h2>
                <p className="text-sm text-slate-500 mb-6">
                  The confirmation link is invalid or has expired.
                </p>
                <Button asChild variant="outline">
                  <Link to="/login">Go to Sign In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
