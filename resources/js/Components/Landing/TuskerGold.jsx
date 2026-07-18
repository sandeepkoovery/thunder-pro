import {
    Zap,
    Wind,
    Volume2,
    Leaf,
    SunMedium,
    Wrench,
    ArrowRight,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useScrollReveal } from "../../hooks/use-parallax";

const features = [
    {
        icon: Zap,
        title: "Plug & Play",
        description: "No civil construction needed. Quick setup and installation.",
    },
    {
        icon: Volume2,
        title: "Completely Noiseless",
        description: "Silent operation ensures a comfortable environment.",
    },
    {
        icon: Leaf,
        title: "Chemical-Free",
        description: "Eco-friendly treatment with zero harmful chemicals.",
    },
    {
        icon: Wind,
        title: "Zero Odour",
        description: "Advanced tech eliminates all unpleasant smells.",
    },
    {
        icon: SunMedium,
        title: "Solar Compatible",
        description: "Runs on renewable energy for sustainable operations.",
    },
    {
        icon: Wrench,
        title: "Low Maintenance",
        description: "Minimal sludge output with nutrient-rich dry residue.",
    },
];

const specs = [
    { label: "BOD", value: "< 10 mg/L" },
    { label: "COD", value: "< 30 mg/L" },
    { label: "TSS", value: "< 20 mg/L" },
    { label: "Pathogen Removal", value: "95%" },
];

function FeatureCard({ feature, index }) {
    const { ref, isVisible } = useScrollReveal(0.15);

    return (
        <div
            ref={ref}
            className={`group flex gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all duration-700 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
            style={{ transitionDelay: `${index * 100}ms` }}
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                <feature.icon className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
                <h4 className="font-serif text-base font-bold text-slate-900">
                    {feature.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                </p>
            </div>
        </div>
    );
}

export function TuskerGold() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);
    const { ref: imageRef, isVisible: imageVisible } = useScrollReveal(0.15);
    const { ref: specsRef, isVisible: specsVisible } = useScrollReveal(0.15);
    const { ref: featTitleRef, isVisible: featTitleVisible } = useScrollReveal(0.2);

    const handleClick = (e) => {
        e.preventDefault();
        document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section id="tusker-gold" className="bg-white py-28">
            <div className="mx-auto max-w-7xl px-6">
                {/* Header */}
                <div
                    ref={headerRef}
                    className={`text-center transition-all duration-700 ${headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                        Flagship Product
                    </p>
                    <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                        What is Tusker Gold?
                    </h2>
                    <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                        Tusker Gold is an advanced wastewater treatment plant developed to
                        effectively treat sewage, greywater, and industrial wastewater.
                        Compact, movable, and completely noiseless, it eliminates the hassles
                        of conventional civil-intensive STPs.
                    </p>
                </div>

                {/* Image + specs */}
                <div className="mt-16 grid items-center gap-14 lg:grid-cols-2">
                    <div
                        ref={imageRef}
                        className={`relative aspect-[4/3] overflow-hidden rounded-2xl transition-all duration-1000 ${imageVisible
                                ? "scale-100 opacity-100"
                                : "scale-95 opacity-0"
                            }`}
                    >
                        <img
                            src="/images/tusker-gold.jpg"
                            alt="Tusker Gold wastewater treatment plant"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div
                        ref={specsRef}
                        className={`transition-all duration-1000 delay-200 ${specsVisible
                                ? "translate-x-0 opacity-100"
                                : "translate-x-12 opacity-0"
                            }`}
                    >
                        <h3 className="font-serif text-2xl font-bold text-slate-900">
                            Output Quality Standards
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Tusker Gold delivers water quality that exceeds regulatory
                            requirements, making treated water safe for reuse.
                        </p>

                        {/* Specs grid */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {specs.map((spec) => (
                                <div
                                    key={spec.label}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <p className="font-serif text-2xl font-bold text-emerald-500">
                                        {spec.value}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {spec.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Button
                            asChild
                            size="lg"
                            className="mt-8 bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                            <a href="#contact" onClick={handleClick}>
                                Request a Quote
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Features grid */}
                <div className="mt-24">
                    <h3
                        ref={featTitleRef}
                        className={`text-center font-serif text-2xl font-bold text-slate-900 transition-all duration-700 ${featTitleVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                            }`}
                    >
                        Key Features
                    </h3>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, i) => (
                            <FeatureCard key={feature.title} feature={feature} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
