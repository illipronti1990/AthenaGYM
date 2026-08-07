'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { trackEvent } from '../lib/analytics';

export function MarketingAnalytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID || '';
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID || '';
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  useEffect(() => {
    let max = 0;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      const bucket = Math.min(100, Math.floor(scrolled / 25) * 25);
      if (bucket > max) {
        max = bucket;
        trackEvent('scroll_depth', { percent: bucket });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const started = Date.now();
    const tick = window.setInterval(() => {
      const sec = Math.round((Date.now() - started) / 1000);
      if (sec > 0 && sec % 30 === 0) trackEvent('engaged_time', { seconds: sec });
    }, 1000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearInterval(tick);
    };
  }, []);

  return (
    <>
      {ga4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga4}');
          `}</Script>
        </>
      ) : null}

      {clarity ? (
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarity}");
        `}</Script>
      ) : null}

      {pixel ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixel}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  );
}
