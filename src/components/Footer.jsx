import React from 'react'

const Footer = () => {
    return (
        <footer className="mt-12 py-12 border-t border-border bg-card">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">Disclaimer</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This project is built for <strong>prototyping and entertainment purposes</strong> only. 
                            Live data insights and visualizations are part of a demonstration of real-time web technologies.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">Data Provider</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            Real-time flight operational data is powered by the 
                            <a 
                                href="https://aviationstack.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-1 font-semibold"
                            >
                                Aviation Stack API
                            </a>.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">Get in Touch</h4>
                        <div className="flex flex-wrap gap-4">
                            <a href="https://www.instagram.com/i.amjean_?igsh=Y3kwMGsxdWQ5enFz" target="_blank" className="block group transition-transform">
                                <img src="/img/ig.svg" alt="Instagram" className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            </a>
                            <a href="https://www.linkedin.com/in/jean-powell-a842002a5/" target="_blank" className="block group transition-transform">
                                <img src="/img/linkedin.svg" alt="Linkedin" className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            </a>
                            <a href="https://wa.me/254774431675" target="_blank" className="block group transition-transform">
                                <img src="/img/whatsapp.svg" alt="Whatsapp" className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            </a>
                            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=jeanobuya8@gmail.com" target="_blank" className="block group transition-transform">
                                <img src="/img/gmail.svg" alt="Gmail" className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            </a>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Designed & Built by Jean. All Rights Reserved © {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
