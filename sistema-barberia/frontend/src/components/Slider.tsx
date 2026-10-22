// Carrusel de imágenes (slider) con autoplay, puntos y flechas.
// Se usa en el HERO de Inicio y en el panel DERECHO de Login/Registro.
import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Diapositiva {
  src: string
  titulo: string
  texto?: string
}

interface Props {
  diapositivas: Diapositiva[]
  className?: string
  intervalo?: number // ms entre diapositivas
}

export function Slider({ diapositivas, className, intervalo = 4200 }: Props) {
  const [referencia, instancia] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: intervalo, stopOnInteraction: false, stopOnMouseEnter: true }),
  ])
  const [actual, setActual] = useState(0)

  const seleccionar = useCallback(() => {
    if (instancia) setActual(instancia.selectedScrollSnap())
  }, [instancia])

  useEffect(() => {
    if (!instancia) return
    instancia.on('select', seleccionar)
    return () => {
      instancia.off('select', seleccionar)
    }
  }, [instancia, seleccionar])

  return (
    <div className={cn('relative overflow-hidden', className)} ref={referencia} role="region" aria-label="Galería de imágenes">
      <div className="flex h-full">
        {diapositivas.map((d) => (
          <div key={d.src} className="relative min-w-0 flex-[0_0_100%]">
            <img
              src={d.src}
              alt={d.titulo}
              draggable={false}
              className="h-full w-full object-cover"
            />
            {/* Degradado + texto sobre la imagen */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="font-display text-lg font-semibold tracking-wide text-foreground">
                {d.titulo}
              </h3>
              {d.texto && <p className="mt-0.5 text-sm text-muted-foreground">{d.texto}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Flechas */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => instancia?.scrollPrev()}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => instancia?.scrollNext()}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Puntos */}
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {diapositivas.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a la diapositiva ${i + 1}`}
            onClick={() => instancia?.scrollTo(i)}
            className={cn(
              'size-2 rounded-full bg-muted-foreground/50 transition-all',
              actual === i && 'w-4 bg-primary'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// Diapositivas compartidas por toda la app (imágenes en /img)
export const GALERIA: Diapositiva[] = [
  { src: '/img/hero-1.jpg', titulo: 'Barbería Élite', texto: 'Un ambiente pensado para ti' },
  { src: '/img/hero-2.jpg', titulo: 'Estilo clásico', texto: 'Sillas vintage y maestros barberos' },
  { src: '/img/hero-3.jpg', titulo: 'Corte a medida', texto: 'Degradados, clásicos y diseños' },
  { src: '/img/hero-4.jpg', titulo: 'Degradados perfectos', texto: 'Precisión en cada línea' },
  { src: '/img/hero-5.jpg', titulo: 'Atención profesional', texto: 'Barberos certificados' },
  { src: '/img/hero-6.jpg', titulo: 'Barba y navaja', texto: 'Arreglo completo con toalla caliente' },
]
