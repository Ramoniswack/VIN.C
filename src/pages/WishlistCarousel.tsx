import React, { useCallback } from 'react'
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react'
import { Button, IconButton } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react'

type WishItem = {
  id: number | string
  productId?: number | string
  title?: string
  image?: string
}

export default function WishlistCarousel({ items, onView, onEdit, onRemove }: { items: WishItem[]; onView: (id: number | string) => void; onEdit: (it: WishItem) => void; onRemove: (id: number | string) => void }) {
  const [emblaRef, emblaApiRef] = useEmblaCarousel({ loop: false })
  // small, local cast to any — embla types are a bit awkward here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emblaApi = emblaApiRef as any

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext && emblaApi.scrollNext(), [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef as React.RefObject<HTMLDivElement> | ((el: HTMLDivElement | null) => void) | null}>
        <div className="flex gap-3">
          {items.map((it) => (
            <div key={String(it.id)} className="min-w-[220px] bg-card p-3 rounded flex-shrink-0">
              <div className="w-full h-40 overflow-hidden rounded-md mb-2">
                <img src={it.image?.startsWith('/') ? it.image : `/${it.image}`} alt={it.title} className="w-full h-full object-cover" />
              </div>
              <div className="font-medium text-sm mb-1 truncate">{it.title}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconButton variant="ghost" size="icon" ariaLabel="View" onClick={() => onView(it.productId ?? it.id)}><Eye className="w-4 h-4" /></IconButton>
                  <IconButton variant="ghost" size="icon" ariaLabel="Edit" onClick={() => onEdit(it)}><Edit2 className="w-4 h-4" /></IconButton>
                </div>
                <IconButton variant="destructive" size="icon" ariaLabel="Remove" onClick={() => onRemove(it.id)}><Trash2 className="w-4 h-4" /></IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <Button variant="ghost" size="icon" onClick={scrollPrev}><ChevronLeft className="w-4 h-4" /></Button>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button variant="ghost" size="icon" onClick={scrollNext}><ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  )
}
