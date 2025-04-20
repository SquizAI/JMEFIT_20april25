import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import type { WithContext, Organization, WebSite } from 'schema-dts';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  video?: string;
  videoType?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoDuration?: number;
  noindex?: boolean;
  structuredData?: WithContext<Organization | WebSite>;
}

export default function SEO({
  title = 'JMEFit - Elite Fitness Training',
  description = 'TRANSFORM YOUR BODY. TRANSFORM YOUR LIFE. Elite Fitness Training by Jaime. Expert-guided programs for sustainable transformation.',
  image = 'https://jmefit.com/og/jmefit-og-image.png',
  url = 'https://jmefit.com',
  type = 'website',
  video,
  videoType = 'video/mp4',
  videoWidth = 1280,
  videoHeight = 720,
  videoDuration,
  noindex = false,
  structuredData
}: SEOProps) {
  // Ensure image URL uses HTTPS and is absolute
  const secureImage = image.startsWith('http') ? image : `https://jmefit.com${image.startsWith('/') ? '' : '/'}${image}`;
  const siteTitle = useMemo(() => 
    title.includes('JMEFit') ? title : `${title} | JMEFit Training`,
    [title]
  );

  const defaultStructuredData: WithContext<Organization> = useMemo(() => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'JMEFit',
      url: 'https://jmefit.com',
      logo: 'https://jmefit.com/JME_fit_purple.png',
      description: 'TRANSFORM YOUR BODY. TRANSFORM YOUR LIFE. Elite Fitness Training by Jaime.',
      image: secureImage,
      sameAs: [
        'https://instagram.com/jmefit',
        'https://facebook.com/jmefit'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'info@jmefit.com'
      }
    }), [secureImage]);

  return (
    <Helmet prioritizeSeoTags defaultTitle="JMEFit Training">
      {/* Basic */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph - Enhanced for mobile compatibility */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={secureImage} />
      <meta property="og:image:secure_url" content={secureImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="JMEFit - Transform Mind & Body, Elevate Life" />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="JMEFit" />
      <meta property="fb:app_id" content="jmefit" />
      
      {/* Video Open Graph tags */}
      {video && (
        <>
          <meta property="og:video" content={video} />
          <meta property="og:video:type" content={videoType} />
          <meta property="og:video:width" content={videoWidth.toString()} />
          <meta property="og:video:height" content={videoHeight.toString()} />
          {videoDuration && <meta property="og:video:duration" content={videoDuration.toString()} />}
          <meta property="og:type" content="video.other" />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={secureImage} />
      <meta name="twitter:creator" content="@jmefit" />
      <meta name="twitter:site" content="@jmefit" />
      <meta name="twitter:image:alt" content="JMEFit - Transform Mind & Body, Elevate Life" />

      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#8B5CF6" />
      
      {/* Mobile */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Preconnect to important domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}