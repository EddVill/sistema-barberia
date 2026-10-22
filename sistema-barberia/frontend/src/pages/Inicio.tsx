// Página de inicio: hero con slider a la derecha, servicios en soles,
// equipo y carrusel de reseñas (HU-41)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { CalendarDays, BadgeCheck, Clock, Scissors, ShieldCheck, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { formatoPEN } from '@/lib/utils'
import type { Barbero, Resena, Servicio } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider, GALERIA } from '@/components/Slider'
import { useAuth } from '@/context/AuthContext'

export default function Inicio() {
  const { usuario } = useAuth()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [resenas, setResenas] = useState<Resena[]>([])
  const [cargando, setCargando] = useState(true)

  // Carrusel de reseñas (autoplay suave)
  const [referencia, instancia] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ])

  useEffect(() => {
    Promise.all([
      api<Servicio[]>('/servicios').catch(() => []),
      api<Barbero[]>('/barberos').catch(() => []),
      api<Resena[]>('/resenas').catch(() => []),
    ])
      .then(([s, b, r]) => {
        setServicios(s)
        setBarberos(b)
        setResenas(r)
      })
      .finally(() => setCargando(false))
  }, [])

  const valoracion =
    resenas.length > 0
      ? (resenas.reduce((s, r) => s + Number(r.calificacion), 0) / resenas.length).toFixed(1)
      : '—'

  return (
    <div className="space-y-12">
      {/* Hero: texto a la izquierda · SLIDER a la derecha */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary to-card px-6 py-10 md:px-10">
          {/* Marca de agua decorativa */}
          <Scissors className="pointer-events-none absolute -bottom-8 -right-8 size-48 rotate-12 text-primary/8" />
          <Badge variant="outline" className="mb-4 w-fit gap-1.5">
            <Star className="size-3 fill-primary text-primary" /> La barbería #1 de la ciudad
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-wide text-primary md:text-5xl">
            ESTILO CLÁSICO,<br />EXPERIENCIA MODERNA
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Reserva tu cita con los mejores barberos en menos de un minuto y paga en soles con
            Yape, Plin o efectivo, con comprobante y protección anti doble cobro. Sin llamadas, sin esperas.
          </p>

          {/* Métodos de pago aceptados */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Aceptamos:</span>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-[#5F259F]" /> Yape
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-[#0088A9]" /> Plin
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-emerald-500" /> Efectivo
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {usuario ? (
              usuario.rol === 'cliente' && (
                <Button size="lg" asChild>
                  <Link to="/reservar">
                    <CalendarDays /> Reservar cita
                  </Link>
                </Button>
              )
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/registro">
                    <CalendarDays /> Reservar cita
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Ya tengo cuenta</Link>
                </Button>
              </>
            )}
          </div>

          {/* Confianza */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-emerald-500" /> Comprobante digital
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" /> Anti doble cobro
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-primary text-primary" /> {valoracion} de valoración
            </span>
          </div>
        </div>

        {/* Slider en la parte derecha */}
        <Slider diapositivas={GALERIA} className="h-72 rounded-2xl border border-border lg:h-auto lg:min-h-[380px]" />
      </section>

      {/* Servicios */}
      <section>
        <h2 className="mb-4 flex items-center gap-3 font-display text-2xl tracking-wide">
          <span className="h-6 w-1.5 rounded-full bg-primary" /> NUESTROS SERVICIOS
        </h2>
        {cargando ? (
          <p className="text-muted-foreground">Cargando servicios…</p>
        ) : servicios.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay servicios disponibles.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s) => (
              <Card key={s.id} className="levita">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold transition-colors hover:text-primary">{s.nombre}</h3>
                    <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">{formatoPEN(s.precio)}</span>
                  </div>
                  {s.descripcion && <p className="mt-1.5 text-sm text-muted-foreground">{s.descripcion}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {s.duracion_min} minutos
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Barberos */}
      <section>
        <h2 className="mb-4 flex items-center gap-3 font-display text-2xl tracking-wide">
          <span className="h-6 w-1.5 rounded-full bg-primary" /> NUESTRO EQUIPO
        </h2>
        {cargando ? (
          <p className="text-muted-foreground">Cargando barberos…</p>
        ) : barberos.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay barberos registrados.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {barberos.map((b) => (
              <Card key={b.id} className="levita">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
                    {b.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{b.especialidad ?? 'Barbero profesional'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reseñas en carrusel */}
      {resenas.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-3 font-display text-2xl tracking-wide">
            <span className="h-6 w-1.5 rounded-full bg-primary" /> LO QUE DICEN NUESTROS CLIENTES
          </h2>
          <div className="overflow-hidden" ref={referencia}>
            <div className="flex gap-4">
              {resenas.map((r) => (
                <Card key={r.id} className="levita min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.cliente?.nombre ?? 'Cliente'}</span>
                        <Badge variant="secondary" className="gap-1">
                          <Star className="size-3 fill-primary text-primary" /> {r.calificacion}/5
                        </Badge>
                      </div>
                      {r.comentario && <p className="mt-2 text-sm text-muted-foreground">“{r.comentario}”</p>}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Servicio: {r.barbero?.nombre ?? 'Barbero'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
