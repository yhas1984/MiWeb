/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'tuenvioexpress.es',
      'www.tuenvioexpress.es',
      'api.twitter.com',
      'pbs.twimg.com',
      // Dominios para imágenes de noticias
      'images.unsplash.com',
      'img.freepik.com',
      'cdn.pixabay.com',
      'via.placeholder.com',
      'www.eluniversal.com',
      'www.elnacional.com',
      'www.bancaynegocios.com',
      'www.elestimulo.com',
      'www.finanzasdigital.com',
      // Dominios de Google News e imágenes de noticias
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'encrypted-tbn0.gstatic.com',
      'encrypted-tbn1.gstatic.com',
      'encrypted-tbn2.gstatic.com',
      'encrypted-tbn3.gstatic.com',
      'news.google.com',
      'yt3.ggpht.com',
      // Dominios de medios venezolanos
      'www.el-nacional.com',
      'www.elnacional.com',
      'www.eluniversal.com',
      'efectococuyo.com',
      'www.efectococuyo.com',
      'www.bancaynegocios.com',
      'www.elestimulo.com',
      'www.finanzasdigital.com',
      'www.dw.com',
      'www.vtv.gob.ve',
      'www.telesurtv.net',
      'www.lapatilla.com',
      'www.noticierodigital.com',
      'www.elimpulso.com',
      'www.2001online.com',
      'www.eltiempo.com',
      'www.aporrea.org',
      'www.talcualdigital.com',
      'www.runrun.es',
      'www.eldiario.es',
      'www.bbc.com',
      'www.cnn.com',
      'www.infobae.com',
      'www.diariolasamericas.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
