/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://ttgshopclone.id.vn',
    generateRobotsTxt: true,
    exclude: [
        '/fadmin',
        '/fadmin/*',
        '/account',
        '/account/*',
        '/auth',
        '/auth/*',
        '/cart',
        '/checkout',
        '/wishlist',
        '/payment',
        '/payment/*',
    ],
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
            },
            {
                userAgent: '*',
                disallow: [
                    '/fadmin',
                    '/fadmin/*',
                    '/account',
                    '/account/*',
                    '/auth',
                    '/auth/*',
                    '/cart',
                    '/checkout',
                    '/wishlist',
                    '/payment',
                    '/payment/*',
                ],
            },
        ],
    },
}
