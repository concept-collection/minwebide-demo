/** A sample PNG, generated on the fly, to exercise the binary file path. */
export async function generateSampleImage(): Promise<Uint8Array> {
	const canvas = document.createElement('canvas');
	canvas.width = 320;
	canvas.height = 200;
	const ctx = canvas.getContext('2d')!;
	const gradient = ctx.createLinearGradient(0, 0, 320, 200);
	gradient.addColorStop(0, '#0078d4');
	gradient.addColorStop(1, '#4ec9b0');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 320, 200);
	ctx.fillStyle = 'white';
	ctx.font = 'bold 28px sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('minwebide', 160, 108);
	const blob = await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'));
	return new Uint8Array(await blob.arrayBuffer());
}
