'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export default function ImageGenerator() {
  const [formState, setFormState] = useState({
    text: 'Enter your text here',
    backgroundColor: '#1E1E1E',
    fontColor: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Arial',
    textX: 50,
    textY: 50,
    lineHeight: 1.2,
    maxWidth: 90,
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    outlineColor: '#000000',
    outlineWidth: 2,
    gradientStart: '#FF0000',
    gradientEnd: '#0000FF',
  });
  const [overlayImages, setOverlayImages] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);

  const handleInputChange = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOverlayImages((prev) => [...prev, {
          src: reader.result,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          shape: 'rectangle'
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const updateOverlayImage = (index, key, value) => {
    setOverlayImages((prev) => prev.map((img, i) => 
      i === index ? { ...img, [key]: value } : img
    ));
  };

  const deleteOverlayImage = (index) => {
    setOverlayImages((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteAllOverlayImages = () => {
    setOverlayImages([]);
  };

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const imageDataUrl = canvas.toDataURL('image/png');
      setImageUrl(imageDataUrl);
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  const drawTextWithEffects = (ctx, text, x, y) => {
    const canvas = canvasRef.current;
    const lines = text.split('\n');
    const lineHeight = formState.fontSize * formState.lineHeight;
    
    ctx.textAlign = formState.textAlign;
    ctx.font = `${formState.fontSize}px ${formState.fontFamily}`;
    
    const gradient = ctx.createLinearGradient(0, y, 0, y + lineHeight * lines.length);
    gradient.addColorStop(0, formState.gradientStart);
    gradient.addColorStop(1, formState.gradientEnd);

    lines.forEach((line, index) => {
      const yPos = y + index * lineHeight;
      const xPos = formState.textAlign === 'center' ? canvas.width / 2 :
                   formState.textAlign === 'right' ? canvas.width - x : x;

      // Draw outline
      ctx.strokeStyle = formState.outlineColor;
      ctx.lineWidth = formState.outlineWidth;
      ctx.strokeText(line, xPos, yPos);

      // Draw text with gradient
      ctx.fillStyle = gradient;
      ctx.fillText(line, xPos, yPos);

      // Apply shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(line, xPos, yPos);

      // Reset shadow
      ctx.shadowColor = 'transparent';
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    ctx.fillStyle = formState.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw overlay images
    overlayImages.forEach((img) => {
      const image = new Image();
      image.src = img.src;
      image.onload = () => {
        if (img.shape === 'circle') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(img.x + img.width / 2, img.y + img.height / 2, img.width / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
        if (img.shape === 'circle') {
          ctx.restore();
        }
      };
    });

    // Draw text
    const xPos = (formState.textX / 100) * canvasWidth;
    const yPos = (formState.textY / 100) * canvasHeight;
    drawTextWithEffects(ctx, formState.text, xPos, yPos);

  }, [formState, overlayImages]);

  return (
    <div className="image-generator">
      <h1>Image Generator</h1>
      <div className="content-container">
        <div className="image-container">
          <canvas ref={canvasRef} width="500" height="300" className="preview-canvas" />
          {imageUrl && (
            <img src={imageUrl} alt="Generated" className="output-image" />
          )}
          <div className="output-actions">
            <button onClick={generateImage} disabled={isGenerating} className={`generate-button ${isGenerating ? 'disabled' : ''}`}>
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
            <button onClick={downloadImage} className="action-button download-button">
              Download Image
            </button>
          </div>
        </div>
        <div className="input-container">
          <div className="input-section">
            <h2>Text Settings</h2>
            <textarea
              value={formState.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              placeholder="Enter text here..."
            />
            <div className="input-group">
              <label>
                Font Size:
                <input
                  type="number"
                  value={formState.fontSize}
                  onChange={(e) => handleInputChange('fontSize', Number(e.target.value))}
                  min="10"
                  max="100"
                />
              </label>
              <label>
                Font Family:
                <select
                  value={formState.fontFamily}
                  onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                >
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </label>
            </div>
            <div className="input-group">
              <label>
                Text X:
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formState.textX}
                  onChange={(e) => handleInputChange('textX', Number(e.target.value))}
                />
              </label>
              <label>
                Text Y:
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formState.textY}
                  onChange={(e) => handleInputChange('textY', Number(e.target.value))}
                />
              </label>
            </div>
            <div className="input-group">
              <label>
                Text Align:
                <select
                  value={formState.textAlign}
                  onChange={(e) => handleInputChange('textAlign', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          </div>
          <div className="input-section">
            <h2>Color Settings</h2>
            <div className="input-group">
              <label>
                Background:
                <input
                  type="color"
                  value={formState.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                />
              </label>
              <label>
                Font Color:
                <input
                  type="color"
                  value={formState.fontColor}
                  onChange={(e) => handleInputChange('fontColor', e.target.value)}
                />
              </label>
            </div>
            <div className="input-group">
              <label>
                Gradient Start:
                <input
                  type="color"
                  value={formState.gradientStart}
                  onChange={(e) => handleInputChange('gradientStart', e.target.value)}
                />
              </label>
              <label>
                Gradient End:
                <input
                  type="color"
                  value={formState.gradientEnd}
                  onChange={(e) => handleInputChange('gradientEnd', e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="input-section">
            <h2>Overlay Images</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button onClick={deleteAllOverlayImages}>Delete All Images</button>
            {overlayImages.map((img, index) => (
              <div key={index} className="overlay-image-controls">
                <h3>Image {index + 1}</h3>
                <div className="input-group">
                  <label>
                    X:
                    <input
                      type="number"
                      value={img.x}
                      onChange={(e) => updateOverlayImage(index, 'x', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Y:
                    <input
                      type="number"
                      value={img.y}
                      onChange={(e) => updateOverlayImage(index, 'y', Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="input-group">
                  <label>
                    Width:
                    <input
                      type="number"
                      value={img.width}
                      onChange={(e) => updateOverlayImage(index, 'width', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Height:
                    <input
                      type="number"
                      value={img.height}
                      onChange={(e) => updateOverlayImage(index, 'height', Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="input-group">
                  <label>
                    Shape:
                    <select
                      value={img.shape}
                      onChange={(e) => updateOverlayImage(index, 'shape', e.target.value)}
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                    </select>
                  </label>
                </div>
                <button onClick={() => deleteOverlayImage(index)}>Delete Image</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .image-generator {
          font-family: Arial, sans-serif;
          background-color: #121212;
          color: #FFFFFF;
          min-height: 100vh;
          padding: 20px;
        }

        h1, h2, h3 {
          margin-bottom: 10px;
        }

        .content-container {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .image-container, .input-container {
          background-color: #1E1E1E;
          padding: 20px;
          border-radius: 10px;
          flex: 1;
        }

        .image-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .preview-canvas, .output-image {
          width: 100%;
          max-width: 500px;
          height: auto;
          margin-bottom: 10px;
          background-color: #2C2C2C;
          border-radius: 5px;
        }

        .input-container {
          max-height: 80vh;
          overflow-y: auto;
        }

        .input-section {
          margin-bottom: 20px;
        }

        .input-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
        }

        textarea, input, select {
          width: 100%;
          padding: 5px;
          margin-bottom: 10px;
          background-color: #2C2C2C;
          color: #FFFFFF;
          border: 1px solid #444444;
          border-radius: 5px;
        }

        textarea {
          height: 100px;
          resize: vertical;
        }

        button {
          padding: 10px;
          background-color: #4CAF50;
          color: #FFFFFF;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-right: 10px;
          margin-bottom: 10px;
        }

        button:hover {
          background-color: #45a049;
        }

        .generate-button {
          background-color: #D4AF37;
          color: #000000;
          font-weight: bold;
        }

        .generate-button:hover {
          background-color: #FFD700;
        }

        .generate-button.disabled {
          background-color: #666666;
          cursor: not-allowed;
        }

        .overlay-image-controls {
          border: 1px solid #444444;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
        }

        @media (max-width: 768px) {
          .content-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}