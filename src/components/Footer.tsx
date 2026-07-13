import { Link } from 'react-router-dom';
import { Stethoscope, Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">ClinicFlow</span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Modern clinic appointment management platform connecting patients with healthcare
              providers. Built with .NET 10 and React for a seamless experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">Home</Link></li>
              <li><Link to="/doctors" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">Find Doctors</Link></li>
              <li><Link to="/login" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">Sign In</Link></li>
              <li><Link to="/register/patient" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">Register</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Tech Stack</h3>
            <ul className="space-y-2">
              <li className="text-sm text-slate-500">.NET 10 Web API</li>
              <li className="text-sm text-slate-500">Entity Framework Core</li>
              <li className="text-sm text-slate-500">React 19 + TypeScript</li>
              <li className="text-sm text-slate-500">Tailwind CSS</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ClinicFlow. All rights reserved.
          </p>
          <a
            href="https://github.com/S3d0o/ClinicFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            View on GitHub
          </a>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            Built with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> using .NET & React
          </p>
        </div>
      </div>
    </footer>
  );
}
