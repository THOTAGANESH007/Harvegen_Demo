'use client'

import Link from 'next/link'
import { Button } from './ui/button'
import { FiCpu, FiGlobe, FiRadio, FiLayers, FiTarget, FiZap, FiSettings, FiBookOpen } from 'react-icons/fi'

function Microcontrollers() {
  return (
    <>
      {/* Page Hero */}
      <header className="pt-[120px] pb-20 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-primary-500/8 to-transparent rounded-full blur-3xl animate-gradient"></div>
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary-500/15 to-primary-500/8 top-1/2 left-1/2 -translate-x-3/5 -translate-y-2/5 pointer-events-none animate-float"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 top-1/4 right-1/4 pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-[1400px] mx-auto px-8 w-full relative z-10">
          <div className="text-sm text-gray-500 mb-6 font-mono animate-fade-in">
            <Link href="/" className="text-gray-400 hover:text-primary-600 transition-colors">Home</Link> <span className="text-gray-400">/</span> <span className="text-primary-600">Microcontrollers</span>
          </div>

          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-3 mb-4 font-semibold text-sm tracking-widest uppercase text-primary-600">
              <span className="w-8 h-px bg-primary-600"></span>
              MCU Platforms
            </div>

            <h1 className="text-gray-900 font-display text-5xl md:text-6xl font-bold leading-tight">
              Microcontroller<br /><span className="text-primary-600">Platform Guide</span>
            </h1>

            <p className="text-gray-600 text-xl max-w-[600px] leading-relaxed">
              Architecture, peripherals, specs, and curated tutorials + projects for each MCU family.
            </p>
          </div>

          <nav className="flex gap-4 flex-wrap mt-8">
            <Link href="#lpc" className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-semibold hover:border-primary-300 hover:text-primary-600 hover:shadow-lg transition-all duration-300 shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 hover:scale-105">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              LPC1768
            </Link>
            <Link href="#stm32" className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-semibold hover:border-primary-300 hover:text-primary-600 hover:shadow-lg transition-all duration-300 shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 hover:scale-105">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              STM32
            </Link>
            <Link href="#arduino" className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-semibold hover:border-primary-300 hover:text-primary-600 hover:shadow-lg transition-all duration-300 shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 hover:scale-105">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Arduino
            </Link>
          </nav>
        </div>
      </header>

      <main className="bg-gradient-to-br from-white to-slate-50">
        {/* LPC1768 Section */}
        <section id="lpc" className="py-24">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl overflow-hidden shadow-lg">
                <img src="/vlsi 2.jpeg" alt="LPC1768" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-gray-900 text-3xl font-bold mb-2">LPC1768 — NXP ARM Cortex-M3</h2>
                <p className="text-gray-600 text-lg leading-relaxed">32-bit Cortex-M3 at 100 MHz. Bare-metal register-level programming powerhouse.</p>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[{ key: 'Core', val: 'ARM Cortex-M3' },
              { key: 'Clock', val: '100 MHz' },
              { key: 'Flash', val: '512 KB' },
              { key: 'SRAM', val: '64 KB' },
              { key: 'GPIO Pins', val: '70' },
              { key: 'ADC', val: '12-bit, 8ch' },
              { key: 'UART', val: '4× UART' },
              { key: 'Supply', val: '3.3 V' },
              ].map((spec, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-1">{spec.key}</div>
                  <div className="font-mono text-lg font-semibold text-gray-900">{spec.val}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  LPC1768 Tutorials
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'GPIO via PINSEL Registers', desc: 'Configure I/O ports, set pin directions bare-metal, and blink LEDs on MBED board.', time: '20 min', level: 'Beginner', icon: FiSettings },
                  { title: 'UART0 on LPC1768', desc: 'Set baud rate, configure UART0, implement interrupt-driven receive with FIFO.', time: '30 min', level: 'Intermediate', icon: FiRadio },
                  ].map((tut, i) => (
                    <Link href="/tutorials" key={i} className="group flex gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all no-underline">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <tut.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{tut.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{tut.desc}</p>
                        <div className="flex gap-3 items-center text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="text-primary-500">⏱</span> {tut.time}
                          </span>
                          <span className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase ${tut.level === 'Beginner' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                              'text-amber-700 border-amber-200 bg-amber-50'
                            }`}>{tut.level}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  LPC1768 Projects
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'Driver Drowsiness Detection', desc: 'IR eye-blink detection with pattern recognition and buzzer/LED alert system.', level: 'Advanced', mcu: 'LPC1768', image: '/vlsi1.jpeg' },
                  { title: 'Smart Door Lock', desc: 'RFID + keypad auth with solenoid lock and I2C EEPROM access log.', level: 'Medium', mcu: 'LPC1768', image: '/iot3.jpg' },
                  ].map((proj, i) => (
                    <article key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="h-[120px] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                        <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase ${proj.level === 'Advanced' ? 'text-red-700 border-red-200 bg-red-50' :
                              'text-amber-700 border-amber-200 bg-amber-50'
                            }`}>{proj.level}</span>
                        </div>
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{proj.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{proj.desc}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-gray-500">{proj.mcu}</span>
                          <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">View Details</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STM32 Section */}
        <section id="stm32" className="py-24 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                <FiCpu className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <h2 className="text-gray-900 text-3xl font-bold mb-2">STM32 — ST ARM Cortex-M4</h2>
                <p className="text-gray-600 text-lg leading-relaxed">Industry-standard up to 168 MHz with FPU, 12-bit ADC, and rich peripheral set.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[{ key: 'Core', val: 'ARM Cortex-M4' },
              { key: 'Clock', val: '168 MHz' },
              { key: 'Flash', val: '1 MB' },
              { key: 'SRAM', val: '192 KB' },
              ].map((spec, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-1">{spec.key}</div>
                  <div className="font-mono text-lg font-semibold text-gray-900">{spec.val}</div>
                </div>
              ))}
            </div>

            {/* ── Simulator Launch Banner ── */}
            <div className="mb-10 rounded-2xl overflow-hidden border border-purple-200 bg-gradient-to-br from-[#0c0e1a] to-[#141827] shadow-xl relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
              <div className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="flex-shrink-0">
                  {/* Animated chip icon */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                    <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
                      <rect x="8" y="8" width="16" height="16" rx="2" fill="none" stroke="#818cf8" strokeWidth="1.5" />
                      <circle cx="11" cy="11" r="1.2" fill="#818cf8" />
                      <circle cx="21" cy="11" r="1.2" fill="#818cf8" />
                      <circle cx="11" cy="21" r="1.2" fill="#818cf8" />
                      <circle cx="21" cy="21" r="1.2" fill="#818cf8" />
                      <rect x="13" y="13" width="6" height="6" rx="1" fill="#6366f1" />
                      <line x1="8" y1="16" x2="4" y2="16" stroke="#818cf8" strokeWidth="1.5" />
                      <line x1="24" y1="16" x2="28" y2="16" stroke="#818cf8" strokeWidth="1.5" />
                      <line x1="16" y1="8" x2="16" y2="4" stroke="#818cf8" strokeWidth="1.5" />
                      <line x1="16" y1="24" x2="16" y2="28" stroke="#818cf8" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 font-mono">NEW</span>
                    <span className="w-1 h-1 rounded-full bg-indigo-600" />
                    <span className="text-xs text-indigo-400 font-mono">Browser-based · No install needed</span>
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-2">STM32 Simulator</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                    Write real C/HAL code in the Monaco editor, press Play — and watch the virtual STM32F103C8 execute it live. GPIO pins respond, the onboard LED blinks, and the Serial Monitor streams your <code className="text-indigo-300">printf()</code> output in real-time.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-5 items-center">
                    <a href="/simulator" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      Launch Simulator
                    </a>
                    <div className="flex gap-3 text-xs text-slate-500 font-mono">
                      {['HAL API', 'GPIO', 'printf()', 'LED Blink', 'Delay'].map(f => (
                        <span key={f} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  STM32 Tutorials
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'STM32 GPIO & HAL Library', desc: 'HAL_GPIO_WritePin, interrupt callbacks, and EXTI lines with CubeMX generation.', time: '25 min', level: 'Beginner', icon: FiSettings },
                  { title: 'FreeRTOS on STM32', desc: 'Set up FreeRTOS with CubeMX, create tasks, use CMSIS RTOS2 API wrappers.', time: '50 min', level: 'Advanced', icon: FiLayers },
                  ].map((tut, i) => (
                    <Link href="/tutorials" key={i} className="group flex gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all no-underline">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <tut.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{tut.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{tut.desc}</p>
                        <div className="flex gap-3 items-center text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="text-primary-500">⏱</span> {tut.time}
                          </span>
                          <span className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase ${tut.level === 'Beginner' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                              'text-red-700 border-red-200 bg-red-50'
                            }`}>{tut.level}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  STM32 Projects
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'Smart Irrigation System', desc: 'ADC moisture sensing, relay pump control, UART logging on STM32F407.', level: 'Medium', mcu: 'STM32F407', image: '/iot.jpeg' },
                  { title: 'Autonomous Rover', desc: 'FreeRTOS multi-task obstacle avoidance + path planning on STM32F411.', level: 'Advanced', mcu: 'STM32F411', image: '/vlsi 2.jpg' },
                  ].map((proj, i) => (
                    <article key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="h-[120px] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                        <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase ${proj.level === 'Medium' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                              'text-red-700 border-red-200 bg-red-50'
                            }`}>{proj.level}</span>
                        </div>
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{proj.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{proj.desc}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-gray-500">{proj.mcu}</span>
                          <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">View Details</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Arduino Section */}
        <section id="arduino" className="py-24">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl flex items-center justify-center shadow-lg">
                <FiZap className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-gray-900 text-3xl font-bold mb-2">Arduino — ATmega Ecosystem</h2>
                <p className="text-gray-600 text-lg leading-relaxed">Beginner-friendly platform. Massive library support, easy IDE, perfect for prototyping.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[{ key: 'Core (Uno)', val: 'ATmega328P' },
              { key: 'Clock', val: '16 MHz' },
              { key: 'Flash', val: '32 KB' },
              { key: 'SRAM', val: '2 KB' },
              ].map((spec, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-1">{spec.key}</div>
                  <div className="font-mono text-lg font-semibold text-gray-900">{spec.val}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  Arduino Tutorials
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'Arduino — Getting Started', desc: 'Install IDE, understand sketch structure, blink LED, and use Serial Monitor.', time: '15 min', level: 'Beginner', icon: FiBookOpen },
                  { title: 'Sensors & analogRead()', desc: 'Interface DHT22, BMP280, and LDR. Use I2C/SPI libraries for sensor fusion.', time: '25 min', level: 'Beginner', icon: FiGlobe },
                  ].map((tut, i) => (
                    <Link href="/tutorials" key={i} className="group flex gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all no-underline">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <tut.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{tut.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{tut.desc}</p>
                        <div className="flex gap-3 items-center text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="text-primary-500">⏱</span> {tut.time}
                          </span>
                          <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase text-emerald-700 border-emerald-200 bg-emerald-50">{tut.level}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-3 mb-6 font-semibold text-sm tracking-widest uppercase text-primary-600">
                  <span className="w-8 h-px bg-primary-600"></span>
                  Arduino Projects
                </div>
                <div className="flex flex-col gap-4">
                  {[{ title: 'IoT Weather Station', desc: 'DHT22 + BMP280 with ESP8266 uploading to Blynk cloud dashboard.', level: 'Beginner', mcu: 'Arduino Uno', image: '/iot2.jpg' },
                  { title: 'Line Follower Robot', desc: 'PID-controlled IR sensor array line tracking on Arduino Nano.', level: 'Medium', mcu: 'Arduino Nano', image: '/iot3.jpg' },
                  ].map((proj, i) => (
                    <article key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-lg transition-all">
                      <div className="h-[120px] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden relative">
                        <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider uppercase ${proj.level === 'Beginner' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                              'text-amber-700 border-amber-200 bg-amber-50'
                            }`}>{proj.level}</span>
                        </div>
                        <h4 className="font-mono text-base font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{proj.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{proj.desc}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-gray-500">{proj.mcu}</span>
                          <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">View Details</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Microcontrollers