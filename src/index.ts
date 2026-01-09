import {
    z,
    type SimpleNSProvider,
    type ProviderManifest,
    type ProviderConfig,
    type DeliveryResult,
    type RateLimitConfig,
    baseNotificationSchema,
} from '@simplens/sdk';

const recipientSchema = z.object({
    user_id: z.string(),
});

const contentSchema = z.object({
    message: z.string(),
});

const mockNotificationSchema = baseNotificationSchema.extend({
    channel: z.literal('mock'),
    recipient: recipientSchema,
    content: contentSchema,
    created_at: z.coerce.date(),
});

type MockNotification = z.infer<typeof mockNotificationSchema>;

class MockProvider implements SimpleNSProvider<MockNotification>{

    private config: ProviderConfig | null = null;

    readonly manifest: ProviderManifest = {
        name: 'simplens-plugin-mock',
        version: '1.0.0',
        channel: 'mock',
        displayName: 'Mock',
        description: 'Send mock notifications for testing',
        author: 'Adhish Krishna S',
        homepage: 'https://github.com/SimpleNotificationSystem/plugin-mock',
        requiredCredentials: [],
    };

    getNotificationSchema(){
        return mockNotificationSchema;
    };

    getRecipientSchema(){
        return recipientSchema;
    };

    getContentSchema() {
        return contentSchema;
    }

    getRateLimitConfig(): RateLimitConfig {
       const options = this.config?.options as Record<string, unknown> | undefined;
        const rateLimit = options?.rateLimit as { maxTokens?: number; refillRate?: number; refillInterval: 'second' | 'minute' | 'hour' | 'day' } | undefined;

        return {
            maxTokens: rateLimit?.maxTokens || 100,
            refillRate: rateLimit?.refillRate || 10,
            refillInterval: rateLimit?.refillInterval || 'second',
        }; 
    }

    async initialize(config: ProviderConfig): Promise<void> {
        this.config = config;
    }

    async healthCheck(): Promise<boolean> {
        return true;
    }

    async send(notification: MockNotification): Promise<DeliveryResult>{
        try {
            console.log('Sending mock notification:', notification);
            console.log('Mock notification');
            return {
                success: true,
            };
        } catch (error) {
            console.error('Failed to send notification:', error);
            return {
                success: false,
            };
        }
    }

    async shutdown(): Promise<void> {
        console.log('Mock provider shutting down');
    }
}

export default MockProvider;