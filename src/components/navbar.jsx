import React from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

const Navbar = ({ isDark, toggleDarkMode }) => {
    return (
        <nav className="w-full z-50 transition-all duration-300 bg-background border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    <div className="flex-shrink-0 flex items-center py-4 gap-3 cursor-pointer group">
                        <div className="w-14 h-14">
                            <img src="/img/Airforce.jpg" alt="" className='w-full h-full rounded-full object-cover' />
                        </div>
                    </div>
                    <div className='text-sm md:text-xl tracking-tight  font-bold'>
                        <h1>Jean's Live Flight Tracker Demo</h1>
                    </div>

                    <div className="flex items-center gap-4">

                        <div className="relative flex items-center rounded-full p-1 transition-colors bg-secondary">
                            <button
                                onClick={() => !isDark && toggleDarkMode()}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${!isDark ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <SunIcon className="w-3.5 h-3.5" />
                                Light
                            </button>
                            <button
                                onClick={() => isDark && toggleDarkMode()}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isDark ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <MoonIcon className="w-3.5 h-3.5" />
                                Dark
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    )
}

export default Navbar