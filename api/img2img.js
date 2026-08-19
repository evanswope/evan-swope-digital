export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { image, prompt, prompt_strength } = req.body;
  
  if (!image || !prompt) return res.status(400).json({ message: 'Missing image or prompt' });

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ message: 'Missing API Token' });

  try {
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "226c6bf67a75a129b0f978e518fed33e1fb13956e15761c1ac53c9d2f898c9af",
        input: {
          image: image,
          prompt: prompt + ", a single unified photograph, seamless composition, cohesive scene, masterpiece, highly detailed",
          negative_prompt: "collage, borders, split screen, multiple panels, grid, separate frames, white borders, margins, panels",
          scale: 0.65, // IP-Adapter scale
        }
      })
    });

    const prediction = await replicateResponse.json();
    if (!replicateResponse.ok) {
      throw new Error(prediction.detail || prediction.error || JSON.stringify(prediction));
    }
    if (prediction.error) throw new Error(prediction.error);

    const getPrediction = async (url) => {
      while (true) {
        const statusRes = await fetch(url, {
          headers: { "Authorization": `Token ${token}` }
        });
        const status = await statusRes.json();
        if (status.status === 'succeeded') {
          return Array.isArray(status.output) ? status.output[0] : status.output;
        }
        if (status.status === 'failed') throw new Error(status.error);
        await new Promise(r => setTimeout(r, 1500));
      }
    };

    const finalImageUrl = await getPrediction(prediction.urls.get);
    return res.status(200).json({ url: finalImageUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
