
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  BookOpen,
  Users,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  ArrowRight,
  Award,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle legal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Elegant floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/[0.015] rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/[0.02] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        {/* Subtle legal icons */}
        <div className="absolute top-1/4 right-1/3 opacity-[0.02]">
          <Scale className="w-64 h-64 text-white" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 opacity-[0.015]">
          <Shield className="w-48 h-48 text-white" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Professional Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/[0.08] text-white px-8 py-3 rounded-2xl text-sm font-bold mb-8 shadow-lg backdrop-blur-md border border-white/[0.15]">
            <Award className="w-5 h-5" />
            Trusted Legal Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              LawFort
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-white/60 to-white/20 mx-auto mb-6" />
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Empowering legal professionals with sophisticated resources, exclusive opportunities,
            and an elite community of industry leaders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-black shadow-xl border border-white/[0.1]">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">LawFort</h3>
            </div>
            <p className="text-gray-400 leading-relaxed font-light">
              The premier platform for legal professionals seeking excellence in education,
              career advancement, and professional networking.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="group p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300">
                <Twitter className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300">
                <Linkedin className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300">
                <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="group p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300">
                <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-black shadow-xl border border-white/[0.1]">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Publications</h3>
            </div>
            <ul className="space-y-4">
              <li>
                <Link to="/blogs" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Blog Posts
                </Link>
              </li>
              <li>
                <Link to="/research" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Research Papers
                </Link>
              </li>
              <li>
                <Link to="/notes" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Professional Notes
                </Link>
              </li>
              <li>
                <Link to="/courses" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Legal Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Career Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-black shadow-xl border border-white/[0.1]">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Career</h3>
            </div>
            <ul className="space-y-4">
              <li>
                <Link to="/jobs" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Job Opportunities
                </Link>
              </li>
              <li>
                <Link to="/internships" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Internships
                </Link>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Career Guidance
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Professional Development
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-black shadow-xl border border-white/[0.1]">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Stay Connected</h3>
            </div>
            <p className="text-gray-400 leading-relaxed font-light">
              Join our exclusive newsletter for the latest legal insights, career opportunities, and industry updates.
            </p>
            <form className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-6 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/[0.2] focus:border-white/[0.2] transition-all duration-300 backdrop-blur-md"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-2 bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                >
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                We respect your privacy. Read our{' '}
                <a href="#" className="text-white hover:underline transition-colors">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="border-t border-white/[0.1] mt-16 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] group-hover:bg-white/[0.08] transition-all duration-300">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Email Us</h4>
                <p className="text-gray-400 text-sm">contact@lawfort.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] group-hover:bg-white/[0.08] transition-all duration-300">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Call Us</h4>
                <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] group-hover:bg-white/[0.08] transition-all duration-300">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Visit Us</h4>
                <p className="text-gray-400 text-sm">Legal District, Professional Plaza</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/[0.1] pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <p className="text-gray-400 text-sm font-light">
                &copy; {new Date().getFullYear()} LawFort. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Shield className="h-4 w-4" />
                <span>Trusted by 10,000+ Legal Professionals</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300 font-medium">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300 font-medium">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300 font-medium">
                Cookie Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-300 font-medium">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
