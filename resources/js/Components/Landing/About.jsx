import { useScrollReveal } from "../../hooks/use-parallax";

export function About() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);
    const { ref: imageRef, isVisible: imageVisible } = useScrollReveal(0.15);
    const { ref: textRef, isVisible: textVisible } = useScrollReveal(0.15);

    return (
        <section id="about" className="bg-white py-28">
            <div className="mx-auto max-w-7xl px-6">
                {/* Section label */}
                <div
                    ref={headerRef}
                    className={`transition-all duration-700 ${headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                        Our Story
                    </p>
                    <h2 className="mt-3 max-w-xl font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                        A Legacy of Innovation and Inspiration
                    </h2>
                </div>

                <div className="mt-16 grid items-center gap-14 lg:grid-cols-2">
                    {/* Image */}
                    <div
                        ref={imageRef}
                        className={`relative aspect-[4/3] overflow-hidden rounded-2xl transition-all duration-1000 ${imageVisible
                                ? "translate-x-0 opacity-100"
                                : "-translate-x-12 opacity-0"
                            }`}
                    >
                        <img
                            src="/images/about-plant.jpg" // Assets need migration
                            alt="Dubhe Merak water treatment facility"
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay card */}
                        <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-[#304d7d]/90 px-6 py-4 backdrop-blur-sm">
                            <p className="text-sm font-medium text-white">
                                Innovation arm of Dubhe Richus - a trusted name with over 33
                                years of legacy
                            </p>
                        </div>
                    </div>

                    {/* Text content */}
                    <div
                        ref={textRef}
                        className={`flex flex-col gap-6 transition-all duration-1000 delay-200 ${textVisible
                                ? "translate-x-0 opacity-100"
                                : "translate-x-12 opacity-0"
                            }`}
                    >
                        <p className="text-base leading-relaxed text-slate-600">
                            The story of Dubhe Merak Pvt Ltd began in 2020, but our roots run
                            much deeper. As the innovation arm of Dubhe Richus, a trusted name
                            in water treatment with over 33 years of legacy and more than
                            60,000 successful installations, Dubhe Merak was founded to take
                            water solutions into the future.
                        </p>
                        <p className="text-base leading-relaxed text-slate-600">
                            While Dubhe Richus focused on reliable manual systems, Dubhe Merak
                            was created to bring fully automatic, eco-friendly technologies to
                            meet the rising demands of modern communities.
                        </p>
                        <p className="text-base leading-relaxed text-slate-600">
                            This journey led to the development of{" "}
                            <span className="font-semibold text-slate-900">Tusker Gold</span>,
                            our next-generation packaged sewage treatment plant. Unlike
                            conventional systems, Tusker Gold is compact, plug-and-play, and
                            designed for quick setup without civil construction.
                        </p>

                        {/* Highlights */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <p className="font-serif text-2xl font-bold text-slate-900">
                                    2020
                                </p>
                                <p className="mt-1 text-sm text-slate-600">Founded</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <p className="font-serif text-2xl font-bold text-slate-900">
                                    60,000+
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Successful Installations
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
