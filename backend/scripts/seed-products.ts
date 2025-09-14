import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../generated/prisma'

async function main() {
  const prisma = new PrismaClient()
  const repoPublic = path.resolve(__dirname, '..', '..', 'public', 'Products')
  const backendPublic = path.resolve(__dirname, '..', 'public', 'Products')
  try { fs.mkdirSync(backendPublic, { recursive: true }) } catch (e) { /* ignore */ }

  const sampleProducts = [
    {
      title: 'Mocca Combo Set',
      slug: 'mocca-combo-set',
      price: 2280,
      images: ['/Products/MoccaCombo.png', '/Products/MoccaCombo2.png', '/Products/MoccaCombo3.jpg'],
      category: 'Sets',
      description: 'Elegant mocca set that combines style and comfort for a refined look.',
      inStock: true,
    },
    {
      title: 'Camo Jacket',
      slug: 'camo-jacket',
      price: 1380,
      images: ['/Products/CamoJack.jpg', '/Products/CamoJack2.jpg', '/Products/CamoJack3.jpg'],
      category: 'Outerwear',
      description: 'Stylish camouflage jacket with premium materials and excellent craftsmanship.',
      inStock: true,
    },
    {
      title: 'Mocca Shirt',
      slug: 'mocca-shirt',
      price: 650,
      images: ['/Products/MoccaShirt.jpg', '/Products/MoccaShirt2.jpg'],
      category: 'Shirts',
      description: 'Premium mocca shirt made with the finest Egyptian cotton.',
      inStock: true,
    },
    {
      title: 'Regal Combo Set',
      slug: 'regal-combo-set',
      price: 2420,
      images: ['/Products/RegalCombo.jpeg', '/Products/RegalCombo2.jpeg', '/Products/RegalCombo3.jpeg'],
      category: 'Sets',
      description: 'Premium matching set including blazer and trousers for a complete elegant look.',
      inStock: true,
    },
    {
      title: 'Regal Chinos',
      slug: 'regal-chinos',
      price: 850,
      images: ['/Products/RegalChinos.jpg', '/Products/RegalChinos2.jpg'],
      category: 'Trousers',
      description: 'Elegant chinos with perfect fit and comfort for all-day wear.',
      inStock: true,
    },
    {
      title: 'Zenkage Jacket',
      slug: 'zenkage-jacket',
      price: 1800,
      images: ['/Products/ZenkageJack.jpg', '/Products/ZenkageJack2.jpg', '/Products/ZenkageJack3.jpg'],
      category: 'Outerwear',
      description: 'Luxurious jacket with exquisite attention to detail and unmatched comfort.',
      inStock: true,
    },
    {
      title: 'White Jacket',
      slug: 'white-jacket',
      price: 1200,
      images: ['/Products/WhiteJack.jpg', '/Products/WhiteJack2.jpg'],
      category: 'Outerwear',
      description: 'Elegant white jacket with premium cotton blend. Perfect for formal and semi-formal occasions.',
      inStock: true,
    },
    {
      title: 'Noragi Overshirt',
      slug: 'noragi-overshirt',
      price: 980,
      images: ['/Products/Noragi.jpg', '/Products/Noragi2.jpg'],
      category: 'Shirts',
      description: 'Japanese-inspired overshirt with traditional details and modern fit.',
      inStock: true,
    }
  ]

  // Copy files from repo public to backend public
  for (const p of sampleProducts) {
    for (const imgPath of p.images) {
      const src = path.join(repoPublic, imgPath.replace(/^\/Products\//, ''))
      const dst = path.join(backendPublic, path.basename(src))
      try {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst)
          console.log('copied', src, '->', dst)
        } else {
          console.warn('source image missing:', src)
        }
      } catch (e) {
        console.warn('failed to copy', src, e)
      }
    }
  }

  // Insert or update products in the database
  for (const p of sampleProducts) {
    try {
      const exists = await prisma.product.findUnique({ where: { slug: p.slug } }).catch(() => null)
      if (exists) {
        await prisma.product.update({ where: { slug: p.slug }, data: { title: p.title, price: p.price, images: p.images, category: p.category, description: p.description, inStock: p.inStock } })
        console.log('updated product', p.slug)
      } else {
        await prisma.product.create({ data: { title: p.title, slug: p.slug, price: p.price, images: p.images, category: p.category, description: p.description, inStock: p.inStock } })
        console.log('created product', p.slug)
      }
    } catch (e) {
      console.warn('db op failed for', p.slug, e)
    }
  }

  console.log('seed complete')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
