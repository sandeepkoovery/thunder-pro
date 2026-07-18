import { Head } from "@inertiajs/react";
import { Navbar } from "../Components/Landing/Navbar";
import { Hero } from "../Components/Landing/Hero";
import { About } from "../Components/Landing/About";
import { Services } from "../Components/Landing/Services";
import { TuskerGold } from "../Components/Landing/TuskerGold";
import { WhyChooseUs } from "../Components/Landing/WhyChooseUs";
import { ParallaxBanner } from "../Components/Landing/ParallaxBanner";
import { ContactCTA } from "../Components/Landing/ContactCTA";
import { Footer } from "../Components/Landing/Footer";

export default function Landing() {
    return (
        <>
            <Head title="Dubhe Merak - Smart Water Treatment Solutions" />

            <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
                <Navbar />

                <main>
                    <Hero />

                    <About />

                    <Services />

                    <ParallaxBanner
                        imageSrc="/images/parallax-1.jpg"
                        imageAlt="Clean water treatment"
                        headline="60,000+ Successful Installations"
                        subline="Delivering pure water solutions across industries and communities for over three decades."
                    />

                    <TuskerGold />

                    <WhyChooseUs />

                    <ParallaxBanner
                        imageSrc="/images/parallax-2.jpg"
                        imageAlt="Sustainability"
                        headline="Zero Civil Construction"
                        subline="Our plug-and-play systems save time, costs, and resources while ensuring peak performance."
                        speed={0.3}
                    />

                    <ContactCTA />
                </main>

                <Footer />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');
        
        :root {
          --font-sans: 'Inter', sans-serif;
          --font-serif: 'Space Grotesk', sans-serif;
        }
        
        .font-serif {
          font-family: var(--font-serif);
        }
      `}} />
        </>
    );
}
