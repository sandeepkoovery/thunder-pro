import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../ui/Button";
import { useScrollReveal } from "../../hooks/use-parallax";

export function ContactCTA() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.15);
    const { ref: infoRef, isVisible: infoVisible } = useScrollReveal(0.15);
    const { ref: formRef, isVisible: formVisible } = useScrollReveal(0.15);

    return (
        <section id="contact" className="bg-white py-28">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-16 lg:grid-cols-2">
                    {/* Left - Info */}
                    <div>
                        <div
                            ref={headerRef}
                            className={`transition-all duration-700 ${headerVisible
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-8 opacity-0"
                                }`}
                        >
                            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                                Get in Touch
                            </p>
                            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                                Ready to Transform Your Water Treatment?
                            </h2>
                            <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
                                Whether you need a new installation or want to upgrade your
                                existing system, our team is ready to help you find the perfect
                                solution.
                            </p>
                        </div>

                        <div
                            ref={infoRef}
                            className={`mt-10 flex flex-col gap-6 transition-all duration-700 delay-200 ${infoVisible
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-8 opacity-0"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                                    <Phone className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-slate-500">
                                        Call Us
                                    </p>
                                    <p className="text-base font-medium text-slate-900">
                                        Contact via website
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                                    <Mail className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-slate-500">
                                        Email
                                    </p>
                                    <p className="text-base font-medium text-slate-900">
                                        info@dubhemerak.com
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                                    <MapPin className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-slate-500">
                                        Location
                                    </p>
                                    <p className="text-base font-medium text-slate-900">
                                        India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Contact form */}
                    <div
                        ref={formRef}
                        className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-1000 delay-300 md:p-10 ${formVisible
                                ? "translate-y-0 opacity-100"
                                : "translate-y-12 opacity-0"
                            }`}
                    >
                        <h3 className="font-serif text-xl font-bold text-slate-900">
                            Send us a message
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Fill out the form and our team will get back to you within 24
                            hours.
                        </p>

                        <form className="mt-8 flex flex-col gap-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500"
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Your full name"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500"
                                >
                                    Phone
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="service"
                                    className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500"
                                >
                                    Service Required
                                </label>
                                <select
                                    id="service"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Select a service</option>
                                    <option value="wtp">Water Treatment Plant (WTP)</option>
                                    <option value="stp">Sewage Treatment Plant (STP)</option>
                                    <option value="etp">Effluent Treatment Plant (ETP)</option>
                                    <option value="tusker-gold">Tusker Gold</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-500"
                                >
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    placeholder="Tell us about your requirements..."
                                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="mt-2 bg-emerald-500 text-white hover:bg-emerald-600"
                            >
                                Send Message
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
