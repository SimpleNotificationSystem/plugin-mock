import { describe, it, expect, beforeEach, vi } from 'vitest';
import MockProvider from './index.js';
import { ProviderConfig } from '@simplens/sdk';

// Helper to create a valid notification
const createValidNotification = (overrides: Partial<{
    notification_id: string;
    request_id: string;
    client_id: string;
    channel: 'mock';
    webhook_url: string;
    retry_count: number;
    recipient: { user_id: string };
    content: { message: string };
    created_at: Date;
}> = {}) => ({
    notification_id: 'test-123',
    request_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
    client_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Valid UUID
    channel: 'mock' as const,
    webhook_url: 'https://example.com/webhook',
    retry_count: 0,
    recipient: { user_id: 'user-456' },
    content: { message: 'Hello, World!' },
    created_at: new Date(),
    ...overrides,
});

// Helper to create a valid provider config
const createProviderConfig = (overrides: Partial<ProviderConfig> = {}): ProviderConfig => {
    return {
        id: 'mock-provider',
        credentials: {},
        options: {},
        ...overrides,
    };
}

describe('MockProvider', () => {
    let provider: MockProvider;

    beforeEach(() => {
        provider = new MockProvider();
        vi.clearAllMocks();
    });

    describe('manifest', () => {
        it('should have correct manifest properties', () => {
            expect(provider.manifest.name).toBe('simplens-plugin-mock');
            expect(provider.manifest.version).toBe('1.0.0');
            expect(provider.manifest.channel).toBe('mock');
            expect(provider.manifest.displayName).toBe('Mock');
            expect(provider.manifest.description).toBe('Send mock notifications for testing');
            expect(provider.manifest.author).toBe('Adhish Krishna S');
            expect(provider.manifest.homepage).toBe('https://github.com/SimpleNotificationSystem/plugin-mock');
            expect(provider.manifest.requiredCredentials).toEqual([]);
        });
    });

    describe('getNotificationSchema', () => {
        it('should return a valid notification schema', () => {
            const schema = provider.getNotificationSchema();
            expect(schema).toBeDefined();
        });

        it('should validate a valid mock notification', () => {
            const schema = provider.getNotificationSchema();
            const validNotification = createValidNotification();

            const result = schema.safeParse(validNotification);
            expect(result.success).toBe(true);
        });

        it('should reject notification with wrong channel', () => {
            const schema = provider.getNotificationSchema();
            const invalidNotification = {
                ...createValidNotification(),
                channel: 'email',
            };

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });

        it('should reject notification with missing recipient user_id', () => {
            const schema = provider.getNotificationSchema();
            const invalidNotification = {
                ...createValidNotification(),
                recipient: {},
            };

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });

        it('should reject notification with missing content message', () => {
            const schema = provider.getNotificationSchema();
            const invalidNotification = {
                ...createValidNotification(),
                content: {},
            };

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });

        it('should coerce string date to Date object', () => {
            const schema = provider.getNotificationSchema();
            const notification = {
                ...createValidNotification(),
                created_at: '2025-12-21T09:00:00Z',
            };

            const result = schema.safeParse(notification);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.created_at).toBeInstanceOf(Date);
            }
        });

        it('should reject notification missing notification_id', () => {
            const schema = provider.getNotificationSchema();
            const { notification_id, ...invalidNotification } = createValidNotification();

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });

        it('should reject notification missing request_id', () => {
            const schema = provider.getNotificationSchema();
            const { request_id, ...invalidNotification } = createValidNotification();

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });

        it('should reject notification missing client_id', () => {
            const schema = provider.getNotificationSchema();
            const { client_id, ...invalidNotification } = createValidNotification();

            const result = schema.safeParse(invalidNotification);
            expect(result.success).toBe(false);
        });
    });

    describe('getRecipientSchema', () => {
        it('should return a valid recipient schema', () => {
            const schema = provider.getRecipientSchema();
            expect(schema).toBeDefined();
        });

        it('should validate a valid recipient', () => {
            const schema = provider.getRecipientSchema();
            const validRecipient = { user_id: 'user-456' };

            const result = schema.safeParse(validRecipient);
            expect(result.success).toBe(true);
        });

        it('should reject recipient without user_id', () => {
            const schema = provider.getRecipientSchema();
            const invalidRecipient = {};

            const result = schema.safeParse(invalidRecipient);
            expect(result.success).toBe(false);
        });

        it('should reject recipient with non-string user_id', () => {
            const schema = provider.getRecipientSchema();
            const invalidRecipient = { user_id: 123 };

            const result = schema.safeParse(invalidRecipient);
            expect(result.success).toBe(false);
        });
    });

    describe('getContentSchema', () => {
        it('should return a valid content schema', () => {
            const schema = provider.getContentSchema();
            expect(schema).toBeDefined();
        });

        it('should validate valid content', () => {
            const schema = provider.getContentSchema();
            const validContent = { message: 'Hello, World!' };

            const result = schema.safeParse(validContent);
            expect(result.success).toBe(true);
        });

        it('should reject content without message', () => {
            const schema = provider.getContentSchema();
            const invalidContent = {};

            const result = schema.safeParse(invalidContent);
            expect(result.success).toBe(false);
        });

        it('should reject content with non-string message', () => {
            const schema = provider.getContentSchema();
            const invalidContent = { message: 123 };

            const result = schema.safeParse(invalidContent);
            expect(result.success).toBe(false);
        });
    });

    describe('getRateLimitConfig', () => {
        it('should return default rate limit config when not initialized', () => {
            const config = provider.getRateLimitConfig();
            expect(config.maxTokens).toBe(100);
            expect(config.refillRate).toBe(10);
        });

        it('should return default rate limit config when initialized without options', async () => {
            await provider.initialize(createProviderConfig());
            const config = provider.getRateLimitConfig();
            expect(config.maxTokens).toBe(100);
            expect(config.refillRate).toBe(10);
        });

        it('should return custom rate limit config when provided', async () => {
            await provider.initialize(createProviderConfig({
                options: {
                    rateLimit: {
                        maxTokens: 200,
                        refillRate: 20,
                    },
                },
            }));
            const config = provider.getRateLimitConfig();
            expect(config.maxTokens).toBe(200);
            expect(config.refillRate).toBe(20);
        });

        it('should use defaults for missing rate limit options', async () => {
            await provider.initialize(createProviderConfig({
                options: {
                    rateLimit: {
                        maxTokens: 150,
                    },
                },
            }));
            const config = provider.getRateLimitConfig();
            expect(config.maxTokens).toBe(150);
            expect(config.refillRate).toBe(10);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully with config', async () => {
            await expect(provider.initialize(createProviderConfig())).resolves.not.toThrow();
        });

        it('should store config for later use', async () => {
            const config = createProviderConfig({
                credentials: { apiKey: 'test-key' },
                options: { rateLimit: { maxTokens: 50 } },
            });
            await provider.initialize(config);

            const rateLimitConfig = provider.getRateLimitConfig();
            expect(rateLimitConfig.maxTokens).toBe(50);
        });
    });

    describe('healthCheck', () => {
        it('should always return true', async () => {
            const result = await provider.healthCheck();
            expect(result).toBe(true);
        });

        it('should return true even before initialization', async () => {
            const result = await provider.healthCheck();
            expect(result).toBe(true);
        });
    });

    describe('send', () => {
        const validNotification = createValidNotification();

        it('should successfully send a notification', async () => {
            const result = await provider.send(validNotification);
            expect(result.success).toBe(true);
        });

        it('should log the notification being sent', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await provider.send(validNotification);

            expect(consoleSpy).toHaveBeenCalledWith('Sending mock notification:', validNotification);
            expect(consoleSpy).toHaveBeenCalledWith('Mock notification');

            consoleSpy.mockRestore();
        });

        it('should work with different notification content', async () => {
            const notification = createValidNotification({
                content: { message: 'A different message' },
            });

            const result = await provider.send(notification);
            expect(result.success).toBe(true);
        });

        it('should work with different recipient', async () => {
            const notification = createValidNotification({
                recipient: { user_id: 'another-user-789' },
            });

            const result = await provider.send(notification);
            expect(result.success).toBe(true);
        });
    });

    describe('shutdown', () => {
        it('should shutdown successfully', async () => {
            await expect(provider.shutdown()).resolves.not.toThrow();
        });

        it('should log shutdown message', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            await provider.shutdown();

            expect(consoleSpy).toHaveBeenCalledWith('Mock provider shutting down');

            consoleSpy.mockRestore();
        });
    });

    describe('integration', () => {
        it('should work through full lifecycle', async () => {
            // Initialize
            await provider.initialize(createProviderConfig({
                credentials: { apiKey: 'test-key' },
                options: { rateLimit: { maxTokens: 50, refillRate: 5 } },
            }));

            // Health check
            const isHealthy = await provider.healthCheck();
            expect(isHealthy).toBe(true);

            // Validate and send notification
            const notification = createValidNotification({
                notification_id: 'lifecycle-test',
                content: { message: 'Integration test message' },
            });

            const schema = provider.getNotificationSchema();
            const validationResult = schema.safeParse(notification);
            expect(validationResult.success).toBe(true);

            const sendResult = await provider.send(notification);
            expect(sendResult.success).toBe(true);

            // Shutdown
            await expect(provider.shutdown()).resolves.not.toThrow();
        });
    });
});
