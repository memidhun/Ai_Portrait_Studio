// This is a serverless function that acts as a secure proxy.
// Place this file in an `/api` directory in your project's root folder.
// Vercel will automatically detect and deploy it as a serverless function.

export default async function handler(req, res) {
    // 1. Define a whitelist of allowed origins
    // This is a more secure and flexible approach for CORS.
    const allowedOrigins = [
      process.env.FRONTEND_URL, // Your main production URL from Vercel env vars
      'http://localhost:3000', // For local development
      'http://127.0.0.1:5500' // For running with Live Server
    ];
  
    // Vercel automatically creates preview URLs. This logic allows them.
    if (process.env.VERCEL_URL && req.headers.origin?.endsWith('.vercel.app')) {
      allowedOrigins.push(req.headers.origin);
    }
  
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  
    // 2. Handle preflight OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // 3. Ensure the request is a POST request
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
  
    // 4. Securely get the API key from environment variables
    // You must set GEMINI_API_KEY in your Vercel project's dashboard.
    const apiKey = process.env.GEMINI_API_KEY;
  
    if (!apiKey) {
      console.error('API key is not configured on the server.');
      res.status(500).json({ error: 'API key is not configured on the server.' });
      return;
    }
  
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
    try {
      // 5. Forward the client's request body to the Google API
      const googleApiResponse = await fetch(googleApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body), 
      });
  
      const data = await googleApiResponse.json();
  
      // 6. Handle errors from the Google API and send them back
      if (!googleApiResponse.ok) {
          console.error('Google API Error:', data);
          res.status(googleApiResponse.status).json({ error: data.error?.message || 'An error occurred with the Google API.' });
          return;
      }
      
      // 7. Send the successful response back to your frontend client
      res.status(200).json(data);
  
    } catch (error) {
      console.error('Server-side error:', error);
      res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
  
  