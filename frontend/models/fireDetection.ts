const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

export interface Detection {
    bbox: [number, number, number, number];
    class: string;
    confidence: number;
}

export const detectFireInImage = async (file: File): Promise<Detection[]> => {
    console.log('Sending image for fire detection:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`http://129.150.38.89:5000/detect_images`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        console.error('Fire detection failed:', response.status, response.statusText);
        throw new Error('Failed to detect fire in image');
    }

    const data = await response.json();
    console.log('Fire detection response:', data);
    return data.detections;
};

export class FireDetectionStream {
    private ws: WebSocket | null = null;
    private videoElement: HTMLVideoElement;
    private canvasElement: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private frameCount: number = 0;
    private readonly SERVER_URL = 'ws://129.150.38.89:5000/ws';
    private readonly RESIZE_WIDTH = 320;
    private readonly RESIZE_HEIGHT = 256;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
        this.canvasElement = document.createElement('canvas');
        const ctx = this.canvasElement.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        this.context = ctx;
    }

    async start() {
        console.log('Starting fire detection stream...');
        // Connect to WebSocket
        this.ws = new WebSocket(this.SERVER_URL);

        // Set up canvas dimensions
        this.canvasElement.width = this.RESIZE_WIDTH;
        this.canvasElement.height = this.RESIZE_HEIGHT;

        // Start sending frames when connection is established
        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            this.sendFrame();
        };

        // Handle incoming detections
        this.ws.onmessage = (event) => {
            const detections: Detection[] = JSON.parse(event.data);
            this.frameCount++;
            if (this.frameCount % 30 === 0) { // Log every 30th frame to avoid console spam
                console.log('Received detections:', detections);
            }
            this.drawDetections(detections);
            // Send next frame
            this.sendFrame();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
        };
    }

    private sendFrame() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Draw current video frame to canvas
        this.context.drawImage(this.videoElement, 0, 0, this.RESIZE_WIDTH, this.RESIZE_HEIGHT);

        // Convert canvas to JPEG and send as binary
        const jpegData = this.canvasElement.toDataURL('image/jpeg', 0.75);
        const base64Data = jpegData.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }

        // Send binary data
        this.ws.send(bytes);
    }

    private drawDetections(detections: Detection[]) {
        const ctx = this.videoElement.parentElement?.querySelector('canvas')?.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Calculate scale factors
        const scaleX = this.videoElement.videoWidth / this.RESIZE_WIDTH;
        const scaleY = this.videoElement.videoHeight / this.RESIZE_HEIGHT;

        // Draw new detections
        detections.forEach(det => {
            const [x1, y1, x2, y2] = det.bbox;

            // Scale coordinates back to original video size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;

            // Draw bounding box
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);

            // Draw label
            ctx.fillStyle = '#FF0000';
            ctx.font = '16px Arial';
            ctx.fillText(`${det.class} ${(det.confidence * 100).toFixed(1)}%`, scaledX1, scaledY1 - 5);
        });
    }

    stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
} 