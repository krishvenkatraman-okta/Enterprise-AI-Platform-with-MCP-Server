import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Boxes, Bot, ArrowRight, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Enterprise AI Platform
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secured by Enterprise SSO</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to the Enterprise AI Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access powerful AI tools and inventory management systems with enterprise-grade security and seamless authentication.
          </p>
        </div>

        {/* Application Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Atlas Beverages */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Atlas Beverages</CardTitle>
              <p className="text-gray-600">Comprehensive Inventory Management</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  Multi-warehouse inventory tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  Real-time stock level monitoring
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  Low stock alerts and reorder management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  Texas, California, and Nevada locations
                </div>
              </div>
              <Link href="/inventory">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3" data-testid="button-access-inventory">
                  Access Inventory System
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Jarvis AI */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-amber-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-10 h-10 text-slate-900" />
                </div>
                <div className="absolute inset-0 w-20 h-20 border-2 border-amber-400 rounded-full animate-spin opacity-30 group-hover:animate-pulse" />
              </div>
              <CardTitle className="text-2xl text-white">J.A.R.V.I.S</CardTitle>
              <p className="text-amber-400">Just A Rather Very Intelligent System</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <Zap className="w-3 h-3 text-amber-400 mr-3" />
                  AI-powered inventory analysis
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <Zap className="w-3 h-3 text-amber-400 mr-3" />
                  Cross-application data access
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <Zap className="w-3 h-3 text-amber-400 mr-3" />
                  Intelligent reporting and insights
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <Zap className="w-3 h-3 text-amber-400 mr-3" />
                  Natural language interaction
                </div>
              </div>
              <Link href="/jarvis">
                <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-medium py-3" data-testid="button-access-jarvis">
                  Initialize J.A.R.V.I.S
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Enterprise Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PKCE Authentication</h3>
              <p className="text-gray-600">Proof Key for Code Exchange ensures secure OAuth flows</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-App Access</h3>
              <p className="text-gray-600">Secure token exchange between applications</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Integration</h3>
              <p className="text-gray-600">Enterprise AI with secure data access</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}