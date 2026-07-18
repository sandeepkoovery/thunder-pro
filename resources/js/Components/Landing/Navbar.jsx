import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Menu, X, Droplets } from "lucide-react";
import { Button } from "../ui/Button";

const navLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Tusker Gold", href: "#tusker-gold" },
    { label: "Why Us", href: "#why-us" },
    { label: "Contact", href: "#contact" },
];

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLinkClick = (e, href) => {
        e.preventDefault();
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-white/95 shadow-lg shadow-blue-900/5 backdrop-blur-xl border-b border-slate-200"
                    : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link
                    href="#home"
                    onClick={(e) => handleLinkClick(e, "#home")}
                    className="flex items-center gap-2"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                        <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`font-serif text-lg font-bold leading-tight tracking-tight transition-colors duration-500 ${scrolled ? "text-slate-900" : "text-white"
                                }`}
                        >
                            Dubhe Merak
                        </span>
                        <span
                            className={`text-[10px] uppercase tracking-widest transition-colors duration-500 ${scrolled
                                    ? "text-slate-500"
                                    : "text-white/60"
                                }`}
                        >
                            Pvt Ltd
                        </span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-8 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={(e) => handleLinkClick(e, link.href)}
                            className={`text-sm font-medium transition-colors duration-300 hover:text-emerald-500 ${scrolled
                                    ? "text-slate-600"
                                    : "text-white/80"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="hidden lg:block">
                    <Button
                        asChild
                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                        <a href="#contact" onClick={(e) => handleLinkClick(e, "#contact")}>
                            Get a Quote
                        </a>
                    </Button>
                </div>

                {/* Mobile toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className={`lg:hidden transition-colors duration-300 ${scrolled ? "text-slate-900" : "text-white"
                        }`}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </nav>

            {/* Mobile menu */}
            <div
                className={`overflow-hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl transition-all duration-500 lg:hidden ${mobileOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 border-none"
                    }`}
            >
                <div className="flex flex-col gap-1 px-6 py-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={(e) => handleLinkClick(e, link.href)}
                            className="rounded-lg px-4 py-3 text-base font-medium text-slate-900 transition-colors hover:bg-slate-50"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Button
                        asChild
                        className="mt-3 bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                        <a href="#contact" onClick={(e) => handleLinkClick(e, "#contact")}>
                            Get a Quote
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
}
