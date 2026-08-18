export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { image, prompt, prompt_strength } = req.body;
  
  if (!image || !prompt) return res.status(400).json({ message: 'Missing image or prompt' });

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ message: 'Missing API Token' });

  try {
    // using stability-ai/sdxl for img2img
    const modelVersion = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"; 
    
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          image: image,
          prompt: prompt + ", masterpiece, high resolution, cohesive scene",
          prompt_strength: prompt_strength || 0.65, // How much to change the original image (0-1)
          num_inference_steps: 30
        }
      })
    });

    const prediction = await replicateResponse.json();
    if (prediction.error) throw new Error(prediction.error);

    const getPrediction = async (url) => {
      while (true) {
        const statusRes = await fetch(url, {
          headers: { "Authorization": `Token ${token}` }
        });
        const status = await statusRes.json();
        if (status.status === 'succeeded') return status.output[0];
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
