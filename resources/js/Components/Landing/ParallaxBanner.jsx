import { useParallax, useScrollReveal } from "../../hooks/use-parallax";

export function ParallaxBanner({
    imageSrc,
    imageAlt,
    headline,
    subline,
    speed = 0.5,
}) {
    const { ref, offset } = useParallax(speed);
    const { ref: textRef, isVisible } = useScrollReveal(0.3);

    return (
        <div
            ref={ref}
            className="relative flex h-[40vh] min-h-[300px] items-center justify-center overflow-hidden md:h-[50vh]"
        >
            {/* Parallax background */}
            <div
                className="absolute inset-[-20%] z-0"
                style={{ transform: `translateY(${offset}px)` }}
            >
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#304d7d]/80" />
            </div>

            {/* Content */}
            <div
                ref={textRef}
                className={`relative z-10 mx-auto max-w-3xl px-6 text-center transition-all duration-1000 ${isVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
            >
                <h3 className="font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                    {headline}
                </h3>
                {subline && (
                    <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                        {subline}
                    </p>
                )}
            </div>
        </div>
    );
}
