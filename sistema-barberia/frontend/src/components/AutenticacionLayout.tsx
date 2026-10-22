// Layout de autenticación: formulario a la izquierda y SLIDER a la derecha
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { Slider, GALERIA } from '@/components/Slider'

export function AutenticacionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Formulario (izquierda) */}
      <div className="flex flex-col items-center justify-center bg-background px-4 py-10">
        <Link to="/" className="mb-2 flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Scissors className="size-5" />
          </span>
          BARBERÍA <span className="-ml-1.5 text-primary">ÉLITE</span>
        </Link>
        <p className="mb-6 text-xs text-muted-foreground">Reservas y pagos en soles (PEN) · Yape · Plin · efectivo</p>
        {children}
      </div>

      {/* Slider (parte derecha, solo escritorio) */}
      <div className="relative hidden lg:block">
        <Slider diapositivas={GALERIA} className="h-full" intervalo= {5000} />
      </div>
    </div>
  )
}
