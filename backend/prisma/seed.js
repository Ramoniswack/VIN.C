"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function main() {
    const products = [
        {
            title: 'Mocca Combo Shirt',
            slug: 'mocca-combo-shirt',
            description: 'Comfortable mocca combo shirt',
            price: 4500,
            images: ['/Products/MoccaCombo.png', '/Products/MoccaCombo2.png', '/Products/MoccaCombo3.jpg'],
            category: 'shirts',
            inStock: true,
        },
        {
            title: 'Regal Chinos',
            slug: 'regal-chinos',
            description: 'Smart casual regal chinos',
            price: 5500,
            images: ['/Products/RegalChinos.jpg', '/Products/RegalChinos2.jpg'],
            category: 'pants',
            inStock: true,
        },
    ];
    for (const p of products) {
        await prisma.product.upsert({
            where: { slug: p.slug },
            update: {},
            create: p,
        });
    }
    const count = await prisma.product.count();
    console.log(`Seeded ${count} products`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map