import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Missing image file in form-data (field: image).' }, { status: 400 });
    }

    const forwardFormData = new FormData();
    forwardFormData.append('image', image, image.name || 'capture.jpg');

    const response = await fetch(`${BACKEND_BASE_URL}/login/face-login`, {
      method: 'POST',
      body: forwardFormData,
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
