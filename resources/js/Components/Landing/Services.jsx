import { Droplets, Factory, Building2, ArrowRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useScrollReveal } from "../../hooks/use-parallax";

const services = [
    {
        number: "01",
        title: "WTP",
        subtitle: "Water Treatment Plant",
        description:
            "Delivers pure and safe water by removing iron, turbidity, odor, and other impurities — ensuring every drop is clean and refreshing.",
        icon: Droplets,
    },
    {
        number: "02",
        title: "STP",
        subtitle: "Sewage Treatment Plant",
        description:
            "Treats domestic wastewater efficiently, converting sewage into reusable, eco-friendly water for non-potable applications.",
        icon: Building2,
    },
    {
        number: "03",
        title: "ETP",
        subtitle: "Effluent Treatment Plant",
        description:
            "Specialized system for treating industrial wastewater, removing harmful chemicals and pollutants before safe discharge or reuse.",
        icon: Factory,
    },
];

function ServiceCard({ service, index }) {
    const { ref, isVisible } = useScrollReveal(0.2);

    const handleClick = (e) => {
        e.preventDefault();
        document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div
            ref={ref}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-700 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 ${isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                }`}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Number */}
            <div>
                <span className="font-serif text-6xl font-bold text-slate-100">
                    {service.number}
                </span>
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                        <service.icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-serif text-xl font-bold uppercase text-slate-900">
                            {service.title}
                        </h3>
                        <p className="text-xs text-slate-500">{service.subtitle}</p>
                    </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-slate-600">
                    {service.description}
                </p>
            </div>

            <a
                href="#contact"
                onClick={handleClick}
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 transition-colors hover:text-emerald-600"
            >
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
        </div>
    );
}

export function Services() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);

    return (
        <section id="services" className="bg-slate-50 py-28">
            <div className="mx-auto max-w-7xl px-6">
                {/* Header */}
                <div
                    ref={headerRef}
                    className={`flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between transition-all duration-700 ${headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                >
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                            Our Services
                        </p>
                        <h2 className="mt-3 max-w-lg font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                            Comprehensive Water Solutions
                        </h2>
                    </div>
                    <p className="max-w-md text-base text-slate-600">
                        Explore a wide range of services tailored to your specific
                        industrial, commercial, and residential water treatment needs.
                    </p>
                </div>

                {/* Service cards */}
                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {services.map((service, i) => (
                        <ServiceCard key={service.number} service={service} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
