import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_ML_API_URL || 'http://127.0.0.1:8000/predict/sequence'
    const contentType = request.headers.get('content-type') || ''

    let res: Response
    try {
      // Stream raw multipart request directly to FastAPI backend to avoid memory buffering bottlenecks
      res = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'content-type': contentType,
        },
        body: request.body,
        // @ts-ignore
        duplex: 'half',
      })
    } catch {
      return NextResponse.json(
        { 
          error: 'Neural inference engine (FastAPI on port 8000) is currently offline. Please ensure the Python API server is running: python -m uvicorn api_server:app --port 8000' 
        }, 
        { status: 503 }
      )
    }

    if (!res.ok) {
      const errText = await res.text()
      try {
        const errJson = JSON.parse(errText)
        return NextResponse.json({ error: errJson.detail || 'Inference error' }, { status: res.status })
      } catch {
        return NextResponse.json({ error: errText || 'Inference failed' }, { status: res.status })
      }
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
