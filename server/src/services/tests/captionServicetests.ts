import { CaptionService } from '../captionService';
import OpenAI from 'openai';
import fs from 'fs';

// Mock OpenAI
jest.mock('openai');

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

describe('CaptionService', () => {
  let captionService: CaptionService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  
  const mockApiKey = 'sk-test-key-123456789';
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockBase64Image = mockImageBuffer.toString('base64');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.OPENAI_API_KEY = mockApiKey;
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
    
    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with API key', () => {
      captionService = new CaptionService();
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: mockApiKey });
    });

    test('should handle missing API key gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      captionService = new CaptionService();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OPENAI_API_KEY not set')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Successful Caption Generation', () => {
    beforeEach(() => {
      captionService = new CaptionService();
    });

    test('should generate 3 captions successfully from buffer', async () => {
      const mockCaptions = [
        'Beautiful sunset over the ocean',
        'Nature at its finest',
        'Peaceful evening vibes',
      ];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockCaptions.join('\n'),
            },
          },
        ],
      } as any);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toEqual(mockCaptions);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    test('should generate captions from file path', async () => {
      const mockFilePath = '/path/to/image.jpg';
      const mockCaptions = [
        'Amazing photo',
        'Incredible moment',
        'Picture perfect',
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockImageBuffer);

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockCaptions.join('\n'),
            },
          },
        ],
      } as any);

      const result = await captionService.generateCaptions(mockFilePath);

      expect(result.success).toBe(true);
      expect(result.captions).toEqual(mockCaptions);
      expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
      expect(fs.promises.readFile).toHaveBeenCalledWith(mockFilePath);
    });

    test('should pad captions if fewer than 3 are returned', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Only one caption',
            },
          },
        ],
      } as any);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/png'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
      expect(result.captions?.[0]).toBe('Only one caption');
    });

    test('should handle different image MIME types', async () => {
      const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);

      for (const mimeType of mimeTypes) {
        const result = await captionService.generateCaptionsFromBuffer(
          mockImageBuffer,
          mimeType
        );

        expect(result.success).toBe(true);
        expect(result.captions).toHaveLength(3);
      }
    });
  });

  describe('Error Handling - API Failures', () => {
    beforeEach(() => {
      captionService = new CaptionService();
    });

    test('should return demo captions on rate limit error (429)', async () => {
      const rateLimitError = new OpenAI.APIError(
        429,
        { error: { message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        {}
      );

      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
      expect(result.captions).toBeDefined();
    });

    test('should return demo captions on authentication error (401)', async () => {
      const authError = new OpenAI.APIError(
        401,
        { error: { message: 'Invalid API key' } },
        'Invalid API key',
        {}
      );

      mockOpenAI.chat.completions.create.mockRejectedValue(authError);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
    });

    test('should return demo captions on bad request error (400)', async () => {
      const badRequestError = new OpenAI.APIError(
        400,
        { error: { message: 'Invalid image format' } },
        'Invalid image format',
        {}
      );

      mockOpenAI.chat.completions.create.mockRejectedValue(badRequestError);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
    });

    test('should handle generic API errors', async () => {
      const genericError = new OpenAI.APIError(
        500,
        { error: { message: 'Internal server error' } },
        'Internal server error',
        {}
      );

      mockOpenAI.chat.completions.create.mockRejectedValue(genericError);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toBeDefined();
    });

    test('should handle non-API errors', async () => {
      const networkError = new Error('Network connection failed');

      mockOpenAI.chat.completions.create.mockRejectedValue(networkError);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
    });

    test('should return demo captions when API returns no content', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      } as any);

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
    });
  });

  describe('Invalid Image Handling', () => {
    beforeEach(() => {
      captionService = new CaptionService();
    });

    test('should return error when image file does not exist', async () => {
      const nonExistentPath = '/path/to/nonexistent.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await captionService.generateCaptions(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Image file not found');
    });

    test('should handle file read errors', async () => {
      const mockFilePath = '/path/to/corrupted.jpg';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await captionService.generateCaptions(mockFilePath);

      expect(result.success).toBe(true); // Returns demo captions
      expect(result.captions).toBeDefined();
    });

    test('should handle empty image buffer', async () => {
      const emptyBuffer = Buffer.from('');

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);

      const result = await captionService.generateCaptionsFromBuffer(
        emptyBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Missing API Key Scenarios', () => {
    test('should return demo captions when API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      captionService = new CaptionService();

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
      expect(result.captions).toBeDefined();
      
      consoleWarnSpy.mockRestore();
    });

    test('should return demo captions when API key is empty string', async () => {
      process.env.OPENAI_API_KEY = '';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      captionService = new CaptionService();

      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      process.env.OPENAI_MAX_REQUESTS_PER_MINUTE = '2';
      process.env.OPENAI_MAX_REQUESTS_PER_HOUR = '10';
      captionService = new CaptionService();

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);
    });

    afterEach(() => {
      delete process.env.OPENAI_MAX_REQUESTS_PER_MINUTE;
      delete process.env.OPENAI_MAX_REQUESTS_PER_HOUR;
    });

    test('should track rate limit status', async () => {
      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');

      const status = captionService.getRateLimitStatus();

      expect(status.requestsInLastMinute).toBe(1);
      expect(status.requestsInLastHour).toBe(1);
      expect(status.maxRequestsPerMinute).toBe(2);
      expect(status.maxRequestsPerHour).toBe(10);
    });

    test('should enforce per-minute rate limit', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Make 2 requests (at the limit)
      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');
      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');

      // Third request should hit rate limit
      const result = await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(result.success).toBe(true);
      expect(result.captions).toBeDefined(); // Returns demo captions
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('rate limit')
      );

      consoleLogSpy.mockRestore();
    });

    test('should update rate limit counters after each request', async () => {
      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');
      let status = captionService.getRateLimitStatus();
      expect(status.requestsInLastMinute).toBe(1);

      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');
      status = captionService.getRateLimitStatus();
      expect(status.requestsInLastMinute).toBe(2);
    });
  });

  describe('OpenAI API Call Mocking', () => {
    beforeEach(() => {
      captionService = new CaptionService();
    });

    test('should call OpenAI with correct parameters', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);

      await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/jpeg'
      );

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          temperature: 0.7,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        })
      );
    });

    test('should include base64 encoded image in API call', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);

      await captionService.generateCaptionsFromBuffer(
        mockImageBuffer,
        'image/png'
      );

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const imageContent = callArgs.messages[0].content[1];

      expect(imageContent.image_url.url).toContain('data:image/png;base64,');
      expect(imageContent.image_url.url).toContain(mockBase64Image);
    });

    test('should use custom model from environment', async () => {
      process.env.OPENAI_MODEL = 'gpt-4-vision-preview';
      captionService = new CaptionService();

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Caption 1\nCaption 2\nCaption 3',
            },
          },
        ],
      } as any);

      await captionService.generateCaptionsFromBuffer(mockImageBuffer, 'image/jpeg');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-vision-preview',
        })
      );

      delete process.env.OPENAI_MODEL;
    });
  });

  describe('Demo Captions', () => {
    test('should return different demo caption sets', async () => {
      delete process.env.OPENAI_API_KEY;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      captionService = new CaptionService();

      const captionSets = new Set();

      // Generate captions multiple times to check for variety
      for (let i = 0; i < 10; i++) {
        const result = await captionService.generateCaptionsFromBuffer(
          mockImageBuffer,
          'image/jpeg'
        );
        
        captionSets.add(JSON.stringify(result.captions));
      }

      // Should have some variety (not all the same)
      expect(captionSets.size).toBeGreaterThan(1);
      
      consoleWarnSpy.mockRestore();
    });
  });
});