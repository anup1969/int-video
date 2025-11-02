import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ShortURLRedirect() {
  const router = useRouter();
  const { shortUrl } = router.query;

  useEffect(() => {
    if (!shortUrl) return;

    // Redirect to the full campaign URL
    const redirectToCampaign = async () => {
      try {
        // Fetch campaign ID from short URL
        const response = await fetch(`/api/short-url/${shortUrl}`);
        const data = await response.json();

        if (data.campaignId) {
          // Redirect to full campaign URL
          window.location.href = `/campaign/${data.campaignId}`;
        } else {
          // Short URL not found
          router.push('/404');
        }
      } catch (error) {
        console.error('Error redirecting:', error);
        router.push('/404');
      }
    };

    redirectToCampaign();
  }, [shortUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Redirecting...</div>
      </div>
    </div>
  );
}
