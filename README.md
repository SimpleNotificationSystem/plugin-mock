# @simplens/mock

A mock provider plugin for [SimpleNS](https://github.com/SimpleNotificationSystem) designed for testing and development purposes.

## Installation

```bash
npm install @simplens/mock
```

## Usage

### Configuration

Add the mock provider to your `simplens.config.yaml`:

```yaml
providers:
  - name: mock
    package: '@simplens/mock'
    options:
      rateLimit:
        maxTokens: 100
        refillRate: 10
```

### Notification Schema

The mock provider accepts notifications with the following structure:

```typescript
{
  channel: 'mock',
  recipient: {
    user_id: string
  },
  content: {
    message: string
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rateLimit.maxTokens` | number | 100 | Maximum number of tokens in the rate limit bucket |
| `rateLimit.refillRate` | number | 10 | Number of tokens refilled per second |

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

## License

MIT

## Author

SimpleNS Team
