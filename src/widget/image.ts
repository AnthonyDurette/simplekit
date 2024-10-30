import { SKElement, SKElementProps } from "./element";
import { SKMouseEvent, SKEvent } from "../events";
import { requestMouseFocus } from "../dispatch";

export type SKImageProps = SKElementProps & { 
  src?: string; 
  width?: number; 
  height?: number; 
  rotation?: number; // Rotation in degrees
  rumble?: boolean;  // Enable rumble/shake effect
};

export class SKImage extends SKElement {
  private _src: string = "";
  private image: HTMLImageElement;
  private rotation: number = 0;  // Default to no rotation
  private rumble: boolean = false;  // Default to no rumble/shake

  // Variables for shake/rumble effect
  private rumbleOffsetX: number = 0;
  private rumbleOffsetY: number = 0;
  private rumbleIntensity: number = 2;  // How much it shakes
  private rumbleFrequency: number = 50; // How fast it shakes (ms)

  private rumbleInterval: any = null;

  constructor({ src = "", width, height, rotation = 0, rumble = false, ...elementProps }: SKImageProps = {}) {
    super(elementProps);
    this._src = src;
    this.image = new Image();
    this.image.src = this._src;

    // Set rotation and rumble values
    this.rotation = rotation;
    this.rumble = rumble;

    
    this.width = width || 100; 
    this.height = height || 100; 

    this.image.onload = () => {
      this.setMinimalSize(this.width, this.height);
      this.doLayout(); // trigger layout once the image is loaded
    };

    // If rumble is enabled, start the shaking effect
    if (this.rumble) {
      this.startRumble();
    }
  }

  get src() {
    return this._src;
  }

  set src(newSrc: string) {
    this._src = newSrc;
    this.image.src = newSrc;
    // Redraw once the new image is loaded
    this.image.onload = () => this.doLayout(); 
  }

  set isRumble(rumbleValue: boolean) {
    if (rumbleValue && !this.rumble) {
      this.startRumble();
    } else if (!rumbleValue){
      this.stopRumble();
    }
    this.rumble = rumbleValue;
  }

  setMinimalSize(width?: number, height?: number) {
    this.width = width || this.image.width || 100; 
    this.height = height || this.image.height || 100; 
  }

  handleMouseEvent(me: SKMouseEvent) {
    switch (me.type) {
      case "mousedown":
        requestMouseFocus(this);
        return true;
      case "mouseup":
        return this.sendEvent({
          source: this,
          timeStamp: me.timeStamp,
          type: "imageClick",
        } as SKEvent);
      case "mouseenter":
      case "mouseexit":
        return true;
    }
    return false;
  }

  // Method to start rumble effect (shaking)
  private startRumble() {
    this.rumbleInterval = setInterval(() => {
      
      this.rumbleOffsetX = (Math.random() - 0.5) * this.rumbleIntensity;
      this.rumbleOffsetY = (Math.random() - 0.5) * this.rumbleIntensity;
      this.doLayout(); 
    }, this.rumbleFrequency);
  }

  // Method to stop rumble effect
  private stopRumble() {
    if (this.rumbleInterval) {
      clearInterval(this.rumbleInterval);
      this.rumbleInterval = null;
      this.rumbleOffsetX = 0;
      this.rumbleOffsetY = 0;
      this.doLayout(); 
    }
  }

  draw(gc: CanvasRenderingContext2D) {
    gc.save();

    const imageWidth = this.width || 100;  
    const imageHeight = this.height || 100;  

    
    gc.translate(this.x + this.rumbleOffsetX, this.y + this.rumbleOffsetY);

    
    if (this.rotation !== 0) {
      const centerX = imageWidth / 2;
      const centerY = imageHeight / 2;
      gc.translate(centerX, centerY);  
      gc.rotate((this.rotation * Math.PI) / 180); 
      gc.translate(-centerX, -centerY); 
    }

    
    gc.drawImage(this.image, 0, 0, imageWidth, imageHeight);

    gc.restore();

    
    super.draw(gc);
  }

  
  public cleanUp() {
    if (this.rumble) {
      this.stopRumble();
    }
  }

  public toString(): string {
    return `SKImage '${this._src}' with rotation: ${this.rotation}`;
  }
}
