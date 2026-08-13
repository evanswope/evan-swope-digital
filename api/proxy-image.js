export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: 'Missing URL parameter' });
  }

  try {
    const fetchRes = await fetch(decodeURIComponent(url));
    if (!fetchRes.ok) {
      throw new Error(`Failed to fetch image: ${fetchRes.statusText}`);
    }

    const contentType = fetchRes.headers.get('content-type') || 'image/webp';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const arrayBuffer = await fetchRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    console.error("Proxy Image Error:", e);
    res.status(500).json({ message: e.message });
  }
}
