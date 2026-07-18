import { ArrowRight, Play } from "lucide-react";
import { Button } from "../ui/Button";
import { useParallax, useScrollReveal } from "../../hooks/use-parallax";

export function Hero() {
    const { ref: parallaxRef, offset } = useParallax(0.4);
    const { ref: contentRef, isVisible } = useScrollReveal(0.1);

    const handleClick = (e, href) => {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section id="home" ref={parallaxRef} className="relative min-h-screen overflow-hidden">
            {/* Parallax background */}
            <div
                className="absolute inset-[-20%] z-0"
                style={{ transform: `translateY(${offset}px)` }}
            >
                <img
                    src="/images/hero-water.jpg" // Note: This image needs to be moved to public/images
                    alt=""
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#304d7d]/75" />
            </div>

            {/* Animated content */}
            <div
                ref={contentRef}
                className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-20 text-center"
            >
                {/* Badge */}
                <div
                    className={`mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
                        }`}
                >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    33+ Years of Legacy in Water Treatment
                </div>

                {/* Headline */}
                <h1
                    className={`max-w-5xl font-serif text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                        }`}
                >
                    Smart Water Treatment
                    <span className="block text-emerald-400">for a Cleaner Tomorrow</span>
                </h1>

                {/* Subheadline */}
                <p
                    className={`mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg md:text-xl transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                        }`}
                >
                    We design and manufacture fully automated WTP, ETP, and STP systems
                    that deliver crystal-clear, reusable water with zero hassle.
                </p>

                {/* CTAs */}
                <div
                    className={`mt-10 flex flex-col items-center gap-4 sm:flex-row transition-all duration-1000 delay-[800ms] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                        }`}
                >
                    <Button
                        asChild
                        size="lg"
                        className="bg-emerald-500 text-white hover:bg-emerald-600 px-8 text-base"
                    >
                        <a href="#services" onClick={(e) => handleClick(e, "#services")}>
                            Explore Solutions
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 px-8 text-base"
                    >
                        <a href="#tusker-gold" onClick={(e) => handleClick(e, "#tusker-gold")}>
                            <Play className="mr-2 h-4 w-4" />
                            Discover Tusker Gold
                        </a>
                    </Button>
                </div>

                {/* Stats row */}
                <div
                    className={`mt-20 grid w-full max-w-3xl grid-cols-3 gap-6 border-t border-white/10 pt-10 transition-all duration-1000 delay-[1000ms] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                        }`}
                >
                    {[
                        { value: "60K+", label: "Installations" },
                        { value: "33+", label: "Years of Legacy" },
                        { value: "95%", label: "Pathogen Removal" },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <p className="font-serif text-3xl font-bold text-emerald-400 sm:text-4xl">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-widest text-white/50 sm:text-sm">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
                <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1">
                    <div className="h-2 w-1 animate-bounce rounded-full bg-white/50" />
                </div>
            </div>
        </section>
    );
}
