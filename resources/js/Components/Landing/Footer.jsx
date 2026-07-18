import { Link } from "@inertiajs/react";
import { Droplets } from "lucide-react";

const footerLinks = {
    services: [
        { label: "Water Treatment (WTP)", href: "#services" },
        { label: "Sewage Treatment (STP)", href: "#services" },
        { label: "Effluent Treatment (ETP)", href: "#services" },
        { label: "Tusker Gold", href: "#tusker-gold" },
    ],
    company: [
        { label: "About Us", href: "#about" },
        { label: "Why Choose Us", href: "#why-us" },
        { label: "Contact", href: "#contact" },
    ],
    connect: [
        { label: "WhatsApp", href: "#" },
        { label: "LinkedIn", href: "#" },
        { label: "Email Us", href: "mailto:info@dubhemerak.com" },
    ],
}

export function Footer() {
    const handleClick = (e, href) => {
        if (href.startsWith("#")) {
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer className="bg-[#304d7d] py-16">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div>
                        <a
                            href="#home"
                            onClick={(e) => handleClick(e, "#home")}
                            className="flex items-center gap-2"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                                <Droplets className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif text-lg font-bold leading-tight text-white">
                                    Dubhe Merak
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-white/50">
                                    Pvt Ltd
                                </span>
                            </div>
                        </a>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
                            Pioneering fully automated, eco-friendly water treatment solutions
                            for a sustainable future.
                        </p>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                            Services
                        </h4>
                        <ul className="mt-4 flex flex-col gap-3">
                            {footerLinks.services.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleClick(e, link.href)}
                                        className="text-sm text-white/60 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                            Company
                        </h4>
                        <ul className="mt-4 flex flex-col gap-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleClick(e, link.href)}
                                        className="text-sm text-white/60 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                            Connect
                        </h4>
                        <ul className="mt-4 flex flex-col gap-3">
                            {footerLinks.connect.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        onClick={(e) => handleClick(e, link.href)}
                                        className="text-sm text-white/60 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                    <p className="text-xs text-white/40">
                        &copy; {new Date().getFullYear()} Dubhe Merak Pvt Ltd. All rights
                        reserved.
                    </p>
                    <p className="text-xs text-white/40">
                        Makers of Tusker Gold - Next Gen Wastewater Treatment
                    </p>
                </div>
            </div>
        </footer>
    );
}
