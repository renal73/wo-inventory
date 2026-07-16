import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure the uploads directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err);
    }

    const savedPaths: string[] = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${uniqueSuffix}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);
      
      // Store the relative path that can be accessed via URL
      savedPaths.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ paths: savedPaths });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}
