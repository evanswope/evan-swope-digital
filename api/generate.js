export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { model_id, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale, aspect_ratio } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Missing prompt' });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ message: 'Server configuration error: Missing API Token' });
  }

  // Model Routing
  let modelOwnerName = "";
  let input = {};

  switch(model_id) {
    case 'sd15':
      modelOwnerName = "runwayml/stable-diffusion-v1.5";
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
        go_fast: true
      };
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
      modelOwnerName = "bytedance/sdxl-lightning-4step";
      input = { prompt, width, height, num_inference_steps: 4, guidance_scale: 0 };
      break;

    case 'realvis':
      modelOwnerName = "adirik/realvisxl-v4.0";
      input = { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale };
      break;

    case 'playground':
      modelOwnerName = "playgroundai/playground-v2.5-1024px-aesthetic";
      input = { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale };
      break;

    case 'sdxl':
    default:
      modelOwnerName = "stability-ai/sdxl";
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
    const response = await fetch(`https://api.replicate.com/v1/models/${modelOwnerName}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input })
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
