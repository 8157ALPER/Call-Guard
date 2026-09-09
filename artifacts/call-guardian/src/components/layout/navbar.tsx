import { Link, useLocation } from "wouter";
import { Phone, Users, Settings, Menu, X, Building2, Shield } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Phone },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/call-centers", label: "Trust List", icon: Building2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-20 justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-wide">Call Guardian</span>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-lg font-medium transition-all duration-200 ${
                  location === href
                    ? "bg-primary-foreground/20 shadow-lg scale-105"
                    : "hover:bg-primary-foreground/10 hover:scale-105"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 space-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link 
                key={href} 
                href={href}
                className={`flex items-center space-x-4 px-6 py-4 rounded-xl text-xl font-medium transition-all duration-200 ${
                  location === href
                    ? "bg-primary-foreground/20 shadow-lg"
                    : "hover:bg-primary-foreground/10"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-7 w-7" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}