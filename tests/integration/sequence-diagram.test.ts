/**
 * Integration tests for sequence diagram rules with real-world examples
 */

import { describe, it, expect } from '@jest/globals';
import { sequenceDiagramWidthRule } from '../../src/rules/sequence-diagram-width';
import { sequenceDiagramHeightRule } from '../../src/rules/sequence-diagram-height';
import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Sequence Diagram - Integration Tests', () => {
  describe('Width Rule - Real-World Examples', () => {
    it('should detect wide microservice interaction diagram', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant User
    participant Frontend
    participant Gateway
    participant AuthService
    participant UserService
    participant OrderService
    participant PaymentService
    participant InventoryService
    participant NotificationService

    User->>Frontend: Place Order
    Frontend->>Gateway: POST /orders
    Gateway->>AuthService: Validate Token
    AuthService-->>Gateway: Valid
    Gateway->>UserService: Get User
    UserService-->>Gateway: User Data
    Gateway->>OrderService: Create Order
    OrderService->>InventoryService: Check Stock
    InventoryService-->>OrderService: Available
    OrderService->>PaymentService: Process Payment
    PaymentService-->>OrderService: Success
    OrderService->>NotificationService: Send Confirmation
    NotificationService-->>OrderService: Sent
    OrderService-->>Gateway: Order Created
    Gateway-->>Frontend: Success
    Frontend-->>User: Order Confirmed`,
        startLine: 1,
        filePath: 'api-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 1000, warning: 1400, error: 1800 },
      };
      const issue = await sequenceDiagramWidthRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('sequence-diagram-width');
      expect(issue?.message).toContain('9 participants');
      expect(issue?.suggestion).toContain('Split into multiple sequence diagrams');
      expect(issue?.severity).toBe('error');
    });

    it('should not trigger for simple authentication flow', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database

    User->>Frontend: Login
    Frontend->>API: POST /auth/login
    API->>Database: Validate credentials
    Database-->>API: User data
    API-->>Frontend: JWT token
    Frontend-->>User: Success`,
        startLine: 1,
        filePath: 'auth-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 1000, warning: 1400, error: 1800 },
      };
      const issue = await sequenceDiagramWidthRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should trigger warning for moderate participant count', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant Client
    participant LoadBalancer
    participant WebServer
    participant AppServer
    participant Database
    participant Cache
    participant Queue

    Client->>LoadBalancer: Request
    LoadBalancer->>WebServer: Forward
    WebServer->>AppServer: Process
    AppServer->>Cache: Check Cache
    Cache-->>AppServer: Miss
    AppServer->>Database: Query
    Database-->>AppServer: Data
    AppServer->>Queue: Enqueue Task
    Queue-->>AppServer: Queued`,
        startLine: 1,
        filePath: 'system-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 1000, warning: 1400, error: 1800 },
      };
      const issue = await sequenceDiagramWidthRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.severity).toBe('warning');
      expect(issue?.message).toContain('7 participants');
    });
  });

  describe('Height Rule - Real-World Examples', () => {
    it('should detect long API workflow', async () => {
      const messages = Array.from(
        { length: 40 },
        (_, i) => `    Service${i % 5}->>Service${(i + 1) % 5}: Step ${i + 1}`
      ).join('\n');

      const diagram: Diagram = {
        content: `sequenceDiagram
    participant Service0
    participant Service1
    participant Service2
    participant Service3
    participant Service4

${messages}`,
        startLine: 1,
        filePath: 'long-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 1200, warning: 1700, error: 2500 },
      };
      const issue = await sequenceDiagramHeightRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('sequence-diagram-height');
      expect(issue?.message).toContain('40 messages');
      expect(issue?.severity).toBe('warning');
    });

    it('should detect nested control structures', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Start Process
    loop Batch Processing
        System->>Database: Get Batch
        Database-->>System: Items
        alt Items Available
            loop Process Each Item
                System->>Database: Process Item
                alt Item Valid
                    Database-->>System: Success
                else Item Invalid
                    Database-->>System: Error
                end
            end
        else No Items
            System->>Database: Mark Complete
        end
    end
    System-->>User: Process Complete`,
        startLine: 1,
        filePath: 'nested-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 600, error: 900 },
      };
      const issue = await sequenceDiagramHeightRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.suggestion).toContain('nesting depth');
      expect(issue?.suggestion).toContain('loop blocks');
    });

    it('should not trigger for short simple flows', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant User
    participant API

    User->>API: Request
    API-->>User: Response`,
        startLine: 1,
        filePath: 'simple-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 1200, warning: 1700, error: 2500 },
      };
      const issue = await sequenceDiagramHeightRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });

  describe('Combined Width and Height', () => {
    it('should detect both width and height issues in complex system', async () => {
      const messages = Array.from(
        { length: 30 },
        (_, i) => `    Service${i % 8}->>Service${(i + 1) % 8}: Message ${i + 1}`
      ).join('\n');

      const diagram: Diagram = {
        content: `sequenceDiagram
    participant Service0
    participant Service1
    participant Service2
    participant Service3
    participant Service4
    participant Service5
    participant Service6
    participant Service7

${messages}`,
        startLine: 1,
        filePath: 'complex-system.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const widthConfig: RuleConfig = {
        enabled: true,
        thresholds: { info: 1000, warning: 1400, error: 1800 },
      };
      const heightConfig: RuleConfig = {
        enabled: true,
        thresholds: { info: 1200, warning: 1700, error: 2500 },
      };

      const widthIssue = await sequenceDiagramWidthRule.check(diagram, metrics, widthConfig);
      const heightIssue = await sequenceDiagramHeightRule.check(diagram, metrics, heightConfig);

      expect(widthIssue).not.toBeNull();
      expect(widthIssue?.message).toContain('8 participants');

      expect(heightIssue).not.toBeNull();
      expect(heightIssue?.message).toContain('30 messages');
    });
  });

  describe('Real-World Authentication Flow', () => {
    it('should analyze complete OAuth flow', async () => {
      const diagram: Diagram = {
        content: `sequenceDiagram
    participant User
    participant App
    participant AuthServer
    participant ResourceServer

    User->>App: Request Protected Resource
    App-->>User: Redirect to Auth
    User->>AuthServer: Login Credentials
    AuthServer->>AuthServer: Validate Credentials
    alt Valid Credentials
        AuthServer-->>User: Authorization Code
        User->>App: Authorization Code
        App->>AuthServer: Exchange Code for Token
        AuthServer-->>App: Access Token
        App->>ResourceServer: Request with Token
        ResourceServer->>AuthServer: Validate Token
        AuthServer-->>ResourceServer: Token Valid
        ResourceServer-->>App: Protected Resource
        App-->>User: Display Resource
    else Invalid Credentials
        AuthServer-->>User: Error Message
        User->>App: Retry
    end`,
        startLine: 1,
        filePath: 'oauth-flow.md',
        type: 'sequence',
      };

      const metrics = analyzeStructure(diagram);
      const widthConfig: RuleConfig = {
        enabled: true,
        thresholds: { info: 1000, warning: 1400, error: 1800 },
      };
      const heightConfig: RuleConfig = {
        enabled: true,
        thresholds: { info: 600, warning: 900, error: 1200 },
      };

      const widthIssue = await sequenceDiagramWidthRule.check(diagram, metrics, widthConfig);
      const heightIssue = await sequenceDiagramHeightRule.check(diagram, metrics, heightConfig);

      // Should not trigger width issue (4 participants)
      expect(widthIssue).toBeNull();

      // May trigger height issue due to alt block and message count
      if (heightIssue) {
        expect(heightIssue.suggestion).toContain('alt/else branches');
      }
    });
  });
});
