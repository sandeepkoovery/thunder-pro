import { Shield, Lightbulb, HeadphonesIcon } from "lucide-react";
import { useScrollReveal } from "../../hooks/use-parallax";

const reasons = [
    {
        number: "01",
        icon: Lightbulb,
        title: "Sustainable & Chemical-Free",
        description:
            "Our eco-friendly solutions protect health and the environment, delivering crystal-clear water without any harmful chemicals.",
    },
    {
        number: "02",
        icon: Shield,
        title: "Proven Legacy & Innovation",
        description:
            "With 33+ years of expertise and 60,000+ installations, we combine time-tested reliability with next-generation technology.",
    },
    {
        number: "03",
        icon: HeadphonesIcon,
        title: "Reliable Service & Support",
        description:
            "From consultation to installation and aftercare, our dedicated team ensures worry-free performance for the life of your plant.",
    },
];

function ReasonCard({ reason, index }) {
    const { ref, isVisible } = useScrollReveal(0.2);

    return (
        <div
            ref={ref}
            className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-700 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Number */}
            <span className="font-serif text-6xl font-bold text-slate-100">
                {reason.number}
            </span>

            {/* Icon */}
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                <reason.icon className="h-6 w-6 text-emerald-500" />
            </div>

            {/* Content */}
            <h3 className="mt-5 font-serif text-xl font-bold text-slate-900">
                {reason.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {reason.description}
            </p>
        </div>
    );
}

export function WhyChooseUs() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);

    return (
        <section id="why-us" className="bg-slate-50 py-28">
            <div className="mx-auto max-w-7xl px-6">
                {/* Header */}
                <div
                    ref={headerRef}
                    className={`text-center transition-all duration-700 ${headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                        Why Choose Us
                    </p>
                    <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                        Discover What Sets Us Apart
                    </h2>
                </div>

                {/* Cards */}
                <div className="mt-16 grid gap-8 md:grid-cols-3">
                    {reasons.map((reason, i) => (
                        <ReasonCard key={reason.number} reason={reason} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
