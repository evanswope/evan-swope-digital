export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { model_id, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale, aspect_ratio, seed } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Missing prompt' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing API Token' });
  }

  // Model Routing
  let modelOwnerName = "";
  let versionHash = "";
  let input = {};

  switch(model_id) {
    case 'sd15':
      versionHash = "a9758cbfbd5f3c20444707b6e6ac2e435529282f40b2f9db154868f0655c829e";
      input = {
        prompt: prompt,
        width: width || 512,
        height: height || 512,
        num_inference_steps: num_inference_steps || 20,
        guidance_scale: guidance_scale || 7.5
      };
      break;

    case 'flux-schnell':
      modelOwnerName = "black-forest-labs/flux-schnell";
      input = {
        prompt: prompt,
        aspect_ratio: aspect_ratio || "1:1",
        output_format: "webp",
        go_fast: true,
        disable_safety_checker: true
      };
      if (seed !== undefined) input.seed = seed;
      break;
    
    case 'sd3':
      modelOwnerName = "stability-ai/stable-diffusion-3";
      input = {
        prompt: prompt,
        negative_prompt: negative_prompt || "",
        aspect_ratio: aspect_ratio || "1:1",
        cfg: guidance_scale || 7.5,
        steps: num_inference_steps || 25,
        output_format: "jpg"
      };
      break;

    case 'sdxl-lightning':
      versionHash = "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637";
      input = { prompt, width, height, num_inference_steps: 4, guidance_scale: 0 };
      break;

    case 'realvis':
      versionHash = "85a58cc71587cc27539b7c83eb1ce4aea02feedfb9a9fae0598cebc110a3d695";
      input = { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale };
      break;

    case 'playground':
      versionHash = "a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24";
      input = { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale };
      break;

    case 'sdxl':
    default:
      versionHash = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
      input = {
        prompt: prompt,
        negative_prompt: negative_prompt || "",
        width: width || 1024,
        height: height || 1024,
        num_inference_steps: num_inference_steps || 25,
        guidance_scale: guidance_scale || 7.5,
        apply_watermark: false
      };
      break;
  }

  try {
    const endpoint = versionHash 
      ? 'https://api.replicate.com/v1/predictions' 
      : `https://api.replicate.com/v1/models/${modelOwnerName}/predictions`;
      
    const reqBody = versionHash 
      ? { version: versionHash, input } 
      : { input };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody)
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
