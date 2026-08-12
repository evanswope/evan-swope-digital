export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;
  const token = process.env.REPLICATE_API_TOKEN;

  if (!id) {
    return res.status(400).json({ message: 'Missing prediction ID' });
  }

  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing API Token' });
  }
  
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ message: error.detail || 'Replicate poll error' });
    }

    const prediction = await response.json();
    
    // Disable Vercel Edge caching so polling gets live data
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.status(200).json(prediction);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error during poll.' });
  }
}
