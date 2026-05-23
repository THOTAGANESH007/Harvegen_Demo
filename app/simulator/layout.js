export const metadata = {
  title: 'STM32 Simulator | Harvegen',
  description: 'Professional STM32 microcontroller simulator — write C code and simulate in real-time.',
}

export default function SimulatorLayout({ children }) {
  // position:fixed covers entire viewport on top of parent layout (Navbar/Footer)
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}
