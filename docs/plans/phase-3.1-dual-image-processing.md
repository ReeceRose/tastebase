# Phase 3.1: Dual Image Processing - AI Vision & Local OCR

**Duration:** 3-4 hours  
**Priority:** Medium-High (AI Integration Enhancement)  
**Prerequisites:** Phase 3 (AI Integration & URL Parsing) completed  
**Dependencies:** OCR service foundation, AI tools infrastructure

---

## Overview

Extend Phase 3's AI integration with dual image processing capabilities, giving users choice between local OCR (privacy-first, no API costs) and cloud AI Vision (higher accuracy, better handwriting recognition). This phase builds on the existing OCR foundation to provide optimal flexibility for different user needs and preferences.

## Goals

- ✅ Dual processing options: Local OCR vs Cloud AI Vision
- ✅ User preference-based routing with smart defaults
- ✅ Seamless integration with existing AI parsing workflow
- ✅ Enhanced image upload experience with drag-drop interface
- ✅ Clear cost and privacy implications for each processing method
- ✅ Fallback strategies for failed processing attempts

---

## Phase 3 Foundation (Already Complete ✅)

**OCR Service Infrastructure:**
- ✅ Tesseract.js integration with worker scheduling
- ✅ Sharp image preprocessing (grayscale, contrast, scaling)
- ✅ Text cleaning and OCR error correction
- ✅ Service initialization and termination management

**AI Integration Infrastructure:**
- ✅ Multi-provider AI support (OpenAI, Anthropic, Google, Ollama)
- ✅ AI tools system with Vercel AI SDK
- ✅ Error handling and progress indicators
- ✅ Tab-based UI with text and URL parsing

---

## Tasks Breakdown

### 1. AI Vision Service (~1 hour)

**File:** `src/lib/ai/services/ai-vision-service.ts`

#### 1.1 Vision Provider Integration
- [x] **GPT-4 Vision Integration**
  ```typescript
  // OpenAI GPT-4V with image input
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: RECIPE_VISION_PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` }}
        ]
      }
    ]
  });
  ```

- [x] **Claude Vision Integration** 
  ```typescript
  // Anthropic Claude 3.5 Sonnet with vision
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user", 
        content: [
          { type: "text", text: RECIPE_VISION_PROMPT },
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64 }}
        ]
      }
    ]
  });
  ```

- [x] **Gemini Vision Integration**
  ```typescript
  // Google Gemini 1.5 Pro with vision
  const response = await google.generateContent([
    RECIPE_VISION_PROMPT,
    {
      inlineData: {
        data: base64,
        mimeType: mimeType
      }
    }
  ]);
  ```

#### 1.2 Vision-Specific Prompts
- [x] **Recipe Vision Prompt Engineering**
  ```typescript
  const RECIPE_VISION_PROMPT = `
  Analyze this image and extract any recipe information you can find.
  Look for:
  - Recipe title and description
  - Ingredient lists with quantities and units
  - Step-by-step instructions
  - Cooking times, temperatures, and servings
  - Any handwritten notes or modifications
  
  Return structured JSON with the recipe data.
  If no recipe is found, return { "error": "No recipe detected in image" }.
  `;
  ```

#### 1.3 Image Processing & Encoding
- [x] **Base64 Encoding Service**
  ```typescript
  export class AIVisionService {
    static async processImageWithVision(
      imageBuffer: Buffer,
      provider: 'openai' | 'anthropic' | 'google',
      userId: string
    ): Promise<RecipeParsingResult>
  }
  ```

- [x] **File Format Support**
  - Support JPEG, PNG, WebP formats
  - Validate file size limits (20MB max for vision APIs)
  - Optimize image size for API cost efficiency

### 2. Smart Image Processor (~1 hour)

**File:** `src/lib/ai/services/image-processor.ts`

#### 2.1 Processing Method Selection
- [x] **User Preference Routing**
  ```typescript
  export type ImageProcessingMethod = 'ocr' | 'ai-vision' | 'auto';
  
  export class ImageProcessor {
    static async processRecipeImage(
      imageBuffer: Buffer,
      method: ImageProcessingMethod,
      userId: string
    ): Promise<RecipeParsingResult> {
      switch (method) {
        case 'ocr':
          return await this.processWithOCR(imageBuffer);
        case 'ai-vision':
          return await this.processWithAIVision(imageBuffer, userId);
        case 'auto':
          return await this.processWithAutoSelection(imageBuffer, userId);
      }
    }
  }
  ```

#### 2.2 Intelligent Auto-Selection
- [x] **Smart Default Logic**
  ```typescript
  private static async processWithAutoSelection(
    imageBuffer: Buffer, 
    userId: string
  ): Promise<RecipeParsingResult> {
    const userConfig = await AIConfigService.getActiveConfig(userId);
    
    // Prefer AI Vision if user has API keys configured
    if (userConfig && userConfig.provider !== 'ollama') {
      try {
        return await this.processWithAIVision(imageBuffer, userId);
      } catch (error) {
        // Fallback to OCR if AI Vision fails
        return await this.processWithOCR(imageBuffer);
      }
    }
    
    // Default to OCR for privacy-first users
    return await this.processWithOCR(imageBuffer);
  }
  ```

#### 2.3 Unified Response Format
- [x] **Consistent Result Structure**
  ```typescript
  export interface ImageProcessingResult extends RecipeParsingResult {
    processingMethod: 'ocr' | 'ai-vision';
    processingTime: number;
    confidence: number;
    fallbackUsed: boolean;
    costEstimate?: number; // For AI Vision processing
  }
  ```

### 3. Image Upload Component (~2 hours)

**File:** `src/components/forms/recipe-image-upload.tsx`

#### 3.1 Drag-and-Drop Interface
- [x] **Modern Upload Experience**
  ```tsx
  export function RecipeImageUpload({ 
    onImageProcessed,
    processingMethod = 'auto',
    disabled = false 
  }: RecipeImageUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    
    return (
      <div className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}>
        {/* Upload UI */}
      </div>
    );
  }
  ```

#### 3.2 File Validation & Preview
- [x] **Comprehensive File Handling**
  ```typescript
  const validateImageFile = (file: File): ValidationResult => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file format' };
    }
    
    // Check file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 20MB)' };
    }
    
    return { valid: true };
  };
  ```

- [x] **Image Preview Grid**
  ```tsx
  const ImagePreview = ({ files, onRemove }: ImagePreviewProps) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      {files.map((file, index) => (
        <div key={`image-preview-${index}`} className="relative group">
          <img 
            src={URL.createObjectURL(file)} 
            alt={`Upload preview ${index + 1}`}
            className="w-full h-24 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
  ```

#### 3.3 Processing Method Indicator
- [x] **Clear Method Communication**
  ```tsx
  const ProcessingMethodIndicator = ({ 
    method, 
    userHasApiKeys 
  }: ProcessingMethodIndicatorProps) => (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        {method === 'ocr' ? (
          <Shield className="h-4 w-4 text-green-600" />
        ) : (
          <Sparkles className="h-4 w-4 text-blue-600" />
        )}
        <span className="text-sm font-medium">
          {method === 'ocr' ? 'Local OCR Processing' : 'AI Vision Processing'}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {method === 'ocr' ? 'Private & Free' : 'Higher Accuracy'}
      </div>
    </div>
  );
  ```

#### 3.4 Multi-Stage Progress Indicators
- [x] **Enhanced Progress Tracking**
  ```tsx
  const ImageProcessingProgress = ({ status }: { status: ProcessingStatus }) => {
    const getStageInfo = (method: 'ocr' | 'ai-vision') => {
      return method === 'ocr' ? [
        { name: 'preprocessing', label: 'Preprocessing image...', progress: 0-20 },
        { name: 'ocr-extraction', label: 'Extracting text...', progress: 20-70 },
        { name: 'ai-parsing', label: 'Parsing recipe data...', progress: 70-100 }
      ] : [
        { name: 'uploading', label: 'Preparing image...', progress: 0-30 },
        { name: 'ai-analysis', label: 'AI analyzing image...', progress: 30-90 },
        { name: 'structuring', label: 'Structuring data...', progress: 90-100 }
      ];
    };

    return <AIProcessingIndicator status={status} stages={getStageInfo(method)} />;
  };
  ```

### 4. Settings Integration (~30 minutes)

**File:** `src/components/forms/ai-settings-form.tsx` (enhancement)

#### 4.1 Processing Method Preferences
- [x] **User Choice Settings**
  ```tsx
  const ImageProcessingSettings = ({ 
    settings, 
    onUpdate 
  }: ImageProcessingSettingsProps) => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Image Processing Method</Label>
      
      <RadioGroup 
        value={settings.imageProcessingMethod} 
        onValueChange={(value) => onUpdate({ imageProcessingMethod: value })}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="auto" id="auto" />
          <Label htmlFor="auto" className="flex-1">
            <div className="font-medium">Auto (Recommended)</div>
            <div className="text-sm text-muted-foreground">
              AI Vision if available, OCR fallback
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ai-vision" id="ai-vision" />
          <Label htmlFor="ai-vision" className="flex-1">
            <div className="font-medium">AI Vision Only</div>
            <div className="text-sm text-muted-foreground">
              Higher accuracy, requires API key, ~$0.01-0.05 per image
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ocr" id="ocr" />
          <Label htmlFor="ocr" className="flex-1">
            <div className="font-medium">Local OCR Only</div>
            <div className="text-sm text-muted-foreground">
              Private processing, free, good for printed text
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
  ```

#### 4.2 Cost & Privacy Information
- [x] **Educational Information Display**
  ```tsx
  const ProcessingMethodInfo = () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Processing Method Comparison</AlertTitle>
      <AlertDescription className="space-y-2">
        <div><strong>Local OCR:</strong> Free, private, works offline. Best for printed recipes.</div>
        <div><strong>AI Vision:</strong> $0.01-0.05 per image, higher accuracy, better for handwritten recipes.</div>
        <div><strong>Auto:</strong> Uses AI Vision if API key available, OCR fallback for privacy.</div>
      </AlertDescription>
    </Alert>
  );
  ```

---

## Integration Points

### 4.1 AI Recipe Parser Integration
- [x] **Add Image Tab to Existing Parser**
  ```tsx
  // In src/components/forms/ai-recipe-parser.tsx
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="text">Text</TabsTrigger>
    <TabsTrigger value="url">URL</TabsTrigger>
    <TabsTrigger value="image">Image</TabsTrigger> {/* NEW */}
  </TabsList>
  
  <TabsContent value="image">
    <RecipeImageUpload
      onImageProcessed={handleImageParsed}
      processingMethod={userSettings.imageProcessingMethod}
    />
  </TabsContent>
  ```

### 4.2 Server Actions Integration
- [x] **Extend Recipe Actions**
  ```typescript
  // In src/lib/server-actions/recipe-actions.ts
  export async function parseRecipeFromImage(
    userId: string,
    imageBuffer: Buffer,
    method: ImageProcessingMethod = 'auto'
  ): Promise<ActionResult<RecipeParsingResult>> {
    try {
      const result = await ImageProcessor.processRecipeImage(imageBuffer, method, userId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Failed to process recipe image' };
    }
  }
  ```

---

## Testing Requirements

### 5.1 Image Processing Tests
- [x] **OCR Processing Tests**
  ```typescript
  describe('OCR Image Processing', () => {
    it('should extract text from printed recipes', async () => {
      const imageBuffer = await fs.readFile('./test/fixtures/printed-recipe.jpg');
      const result = await ImageProcessor.processRecipeImage(imageBuffer, 'ocr', userId);
      expect(result.success).toBe(true);
      expect(result.data.title).toBeDefined();
    });
  });
  ```

- [x] **AI Vision Tests** (with mock APIs)
  ```typescript
  describe('AI Vision Processing', () => {
    it('should process images with GPT-4 Vision', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockVisionResponse);
      const result = await AIVisionService.processImageWithVision(imageBuffer, 'openai', userId);
      expect(result.success).toBe(true);
    });
  });
  ```

### 5.2 UI Component Tests
- [x] **Upload Component Tests**
  ```typescript
  describe('RecipeImageUpload', () => {
    it('should validate file types and sizes', () => {
      const validFile = new File(['test'], 'recipe.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(validFile);
      expect(result.valid).toBe(true);
    });
    
    it('should reject oversized files', () => {
      const largeFile = new File([new ArrayBuffer(25 * 1024 * 1024)], 'large.jpg');
      const result = validateImageFile(largeFile);
      expect(result.valid).toBe(false);
    });
  });
  ```

---

## Performance & Cost Considerations

### 6.1 Performance Targets
- **OCR Processing:** <30 seconds for typical recipe images
- **AI Vision Processing:** <15 seconds (faster than OCR+AI text parsing)
- **Image Upload:** Progressive enhancement with preview
- **Fallback Handling:** <5 seconds to switch methods

### 6.2 Cost Management
- **AI Vision Cost:** ~$0.01-0.05 per image (varies by provider)
- **OCR Cost:** Free (local processing only)
- **User Education:** Clear cost implications in settings
- **Budget Integration:** Use existing AI cost tracking system

---

## Risk Assessment

### 🟡 Medium Risk
- **AI Vision Accuracy:** May vary significantly across providers and image quality
- **Cost Surprise:** Users might not understand AI Vision costs
- **Processing Time:** Image processing inherently slower than text

### 🟢 Low Risk  
- **Technical Implementation:** Building on solid Phase 3 foundation
- **OCR Fallback:** Reliable local processing always available
- **User Choice:** Clear control over processing method and costs

---

## Success Criteria

### ✅ Phase 3.1 Complete When:

#### Core Functionality
- [x] Users can upload recipe images via drag-and-drop interface
- [x] Images process via both OCR and AI Vision methods
- [x] User can choose processing method in settings
- [x] Processing progress clearly communicated with method-specific stages
- [x] Failed processing gracefully falls back to manual entry

#### User Experience
- [x] Clear cost and privacy implications for each method
- [x] Seamless integration with existing AI recipe parser (3rd tab)
- [x] File validation prevents unsupported formats/sizes
- [x] Image previews show before processing
- [x] Processing method clearly indicated during upload

#### Technical Requirements
- [x] AI Vision integration with GPT-4V, Claude Vision, Gemini
- [x] Smart auto-selection based on user's AI configuration
- [x] Unified response format for both processing methods
- [x] Comprehensive error handling and fallback strategies
- [x] Performance meets targets (<30s OCR, <15s AI Vision)

---

## Files to Create/Modify

### New Files
- `src/lib/ai/services/ai-vision-service.ts`
- `src/lib/ai/services/image-processor.ts`
- `src/components/forms/recipe-image-upload.tsx`
- `src/lib/types/image-processing-types.ts`

### Modified Files  
- `src/components/forms/ai-recipe-parser.tsx` (add image tab)
- `src/components/forms/ai-settings-form.tsx` (add method preferences)
- `src/lib/server-actions/recipe-actions.ts` (add image processing)
- `src/lib/types/index.ts` (export new types)

### Test Files
- `src/lib/ai/services/__tests__/ai-vision-service.test.ts`
- `src/lib/ai/services/__tests__/image-processor.test.ts`
- `src/components/forms/__tests__/recipe-image-upload.test.tsx`

---

This phase strategically builds on Phase 3's solid foundation to provide users with flexible, cost-conscious image processing options while maintaining the privacy-first approach of the existing OCR system.