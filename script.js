const container = document.querySelector('.hero-container');
const canvas = document.getElementById('reveal-canvas');
const ctx = canvas.getContext('2d', { alpha: true });

// Offscreen canvas to hold the brush mask trail
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d', { alpha: true });

// Load both images
const baseImg = new Image();
baseImg.src = 'image-1 (2).jpeg';

const overlayImg = new Image();
overlayImg.src = 'image-1.jpeg';

let width, height;

function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;
}

window.addEventListener('resize', resize);
resize();

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let currentX = mouseX;
let currentY = mouseY;

container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Helper function to calculate cover dimensions based on a reference image
function getCoverDimensions(img) {
    if (!img.complete) return null;
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
    } else {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
}

function animate() {
    // 1. Fade out the brush trail over time
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0.04)'; // Adjust for longer/shorter trail
    maskCtx.fillRect(0, 0, width, height);

    // 2. Instantly track the mouse (no delay)
    const prevX = currentX;
    const prevY = currentY;
    currentX = mouseX;
    currentY = mouseY;

    // Calculate movement distance
    const dist = Math.hypot(currentX - prevX, currentY - prevY);

    // 3. Draw the new brush stroke on the mask ONLY if moving
    if (dist > 0.2) {
        maskCtx.globalCompositeOperation = 'source-over';
        const radius = 120; // Decreased size of the brush
        const gradient = maskCtx.createRadialGradient(currentX, currentY, 0, currentX, currentY, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        maskCtx.beginPath();
        maskCtx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        maskCtx.fillStyle = gradient;
        maskCtx.fill();
    }

    // 4. Render the final composite to the screen
    ctx.clearRect(0, 0, width, height);

    // Get exact cover dimensions from the base image so both align perfectly
    const dims = getCoverDimensions(baseImg);
    if (!dims) {
        requestAnimationFrame(animate);
        return;
    }

    // A) Draw the mask
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(maskCanvas, 0, 0);

    // B) Draw the overlay image on top, keeping only the masked pixels
    ctx.globalCompositeOperation = 'source-in';
    if (overlayImg.complete) {
        ctx.drawImage(overlayImg, dims.offsetX, dims.offsetY, dims.drawWidth, dims.drawHeight);
    }

    // C) Draw the base image BEHIND everything
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(baseImg, dims.offsetX, dims.offsetY, dims.drawWidth, dims.drawHeight);

    // Reset back to normal for next frame
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(animate);
}

animate();
