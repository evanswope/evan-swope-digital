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

    case 'flux-dev':
      modelOwnerName = "black-forest-labs/flux-dev";
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
