export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Missing prompt' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing API Token' });
  }

  try {
    // 1. Send prediction request to Replicate's SDXL 1.0 model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // The specific version hash for stability-ai/sdxl
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
          prompt: prompt,
          negative_prompt: negative_prompt || "",
          width: width || 1024,
          height: height || 1024,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: num_inference_steps || 25,
          guidance_scale: guidance_scale || 7.5
        }
      })
    });

    if (response.status !== 201) {
      let error = await response.json();
      return res.status(500).json({ message: error.detail || 'Replicate API error' });
    }

    let prediction = await response.json();
    
    // Return the prediction ID instantly to avoid Vercel 10s timeout
    res.status(200).json({ id: prediction.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error while generating image.' });
  }
}
