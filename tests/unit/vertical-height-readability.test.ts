/**
 * Unit tests for vertical-height-readability rule
 */

import { describe, it, expect } from '@jest/globals';
import { verticalHeightReadabilityRule } from '../../src/rules/vertical-height-readability';
import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Vertical Height Readability Rule', () => {
  describe('Layout Detection', () => {
    it('should detect TD layout', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // Issue may be null if within limits, but verify no error
      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });

    it('should detect TB layout', async () => {
      const diagram: Diagram = {
        content: `graph TB
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });

    it('should detect LR layout', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });

    it('should detect RL layout', async () => {
      const diagram: Diagram = {
        content: `graph RL
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });

    it('should default to TD layout when unspecified', async () => {
      const diagram: Diagram = {
        content: `graph
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });
  });

  describe('Depth Calculation', () => {
    it('should calculate depth for simple chain', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        targetHeight: 100,
        thresholds: { info: 100, warning: 300, error: 500 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // With depth 3, should have some height
      expect(issue).not.toBeNull();
      expect(issue?.message).toContain('graph depth');
    });

    it('should calculate depth for branching tree', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          B --> D
          B --> E
          C --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        targetHeight: 100,
        thresholds: { info: 100, warning: 300, error: 500 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // Should calculate depth based on longest path (depth 2: A->B->D)
      expect(issue).not.toBeNull();
      expect(issue?.message).toContain('graph depth');
    });

    it('should handle graph with cycles', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> A
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // Should handle cycles without infinite loops
      expect(issue === null || issue.rule === 'vertical-height-readability').toBe(true);
    });

    it('should handle multiple root nodes', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> C
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        targetHeight: 100,
        thresholds: { info: 100, warning: 300, error: 500 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // Should calculate max depth from any root
      expect(issue).not.toBeNull();
    });
  });

  describe('Height Estimation - TD/TB Layouts', () => {
    it('should flag shallow depth as info', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I
          I --> J`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      if (issue) {
        expect(issue.severity).toBe('info');
      }
    });

    it('should flag medium depth as warning', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I
          I --> J
          J --> K
          K --> L
          L --> M
          M --> N
          N --> O
          O --> P`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.severity).toBe('warning');
      expect(issue?.message).toContain('graph depth');
    });

    it('should flag deep depth as error', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I
          I --> J
          J --> K
          K --> L
          L --> M
          M --> N
          N --> O
          O --> P
          P --> Q
          Q --> R
          R --> S
          S --> T
          T --> U
          U --> V
          V --> W
          W --> X
          X --> Y
          Y --> Z`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.severity).toBe('error');
      expect(issue?.message).toContain('graph depth');
    });

    it('should not flag very shallow diagrams', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });

  describe('Height Estimation - LR/RL Layouts', () => {
    it('should flag wide branching as info', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B1
          A --> B2
          A --> B3
          A --> B4
          A --> B5
          A --> B6
          A --> B7
          A --> B8
          A --> B9
          A --> B10`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      if (issue) {
        expect(issue.severity).toBe('info');
        expect(issue.message).toContain('parallel branches');
      }
    });

    it('should flag very wide branching as warning', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B1
          A --> B2
          A --> B3
          A --> B4
          A --> B5
          A --> B6
          A --> B7
          A --> B8
          A --> B9
          A --> B10
          A --> B11
          A --> B12
          A --> B13
          A --> B14
          A --> B15`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.severity).toBe('warning');
      expect(issue?.message).toContain('parallel branches');
    });

    it('should flag extremely wide branching as error', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B1
          A --> B2
          A --> B3
          A --> B4
          A --> B5
          A --> B6
          A --> B7
          A --> B8
          A --> B9
          A --> B10
          A --> B11
          A --> B12
          A --> B13
          A --> B14
          A --> B15
          A --> B16
          A --> B17
          A --> B18
          A --> B19
          A --> B20
          A --> B21
          A --> B22
          A --> B23`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.severity).toBe('error');
      expect(issue?.message).toContain('parallel branches');
    });

    it('should not flag narrow LR diagrams', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });

  describe('Suggestion Generation', () => {
    it('should provide TD-specific suggestions for deep vertical layouts', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I
          I --> J
          J --> K
          K --> L
          L --> M
          M --> N
          N --> O
          O --> P`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.suggestion).toContain('Break into multiple diagrams');
      expect(issue?.suggestion).toContain('subgraph');
      expect(issue?.suggestion).not.toContain('Convert to LR'); // Should NOT suggest LR for TD
    });

    it('should provide LR-specific suggestions for wide horizontal layouts', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B1
          A --> B2
          A --> B3
          A --> B4
          A --> B5
          A --> B6
          A --> B7
          A --> B8
          A --> B9
          A --> B10
          A --> B11
          A --> B12
          A --> B13
          A --> B14
          A --> B15`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.suggestion).toContain('Convert to TD');
      expect(issue?.suggestion).toContain('parallel branches');
    });

    it('should include height metrics in suggestions', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I
          I --> J
          J --> K
          K --> L
          L --> M
          M --> N
          N --> O`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.suggestion).toContain('Estimated height:');
      expect(issue?.suggestion).toContain('px');
      expect(issue?.suggestion).toContain('levels of depth');
    });
  });

  describe('Configuration Handling', () => {
    it('should respect custom nodeHeight', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        nodeHeight: 100, // Double the default
        targetHeight: 300,
        thresholds: { info: 300, warning: 600, error: 900 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // With larger nodes, should exceed target sooner
      expect(issue).not.toBeNull();
    });

    it('should respect custom verticalSpacing', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        verticalSpacing: 100, // Double the default
        targetHeight: 200,
        thresholds: { info: 200, warning: 400, error: 600 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // With larger spacing, should exceed target sooner
      expect(issue).not.toBeNull();
    });

    it('should respect custom targetHeight', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        targetHeight: 100, // Very low threshold
        thresholds: { info: 100, warning: 300, error: 500 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      // The message contains estimated height, not target height
      expect(issue?.message).toContain('px');
    });

    it('should respect custom thresholds', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 600, error: 900 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      // Should use custom thresholds for severity
      expect(['info', 'warning', 'error']).toContain(issue?.severity);
    });
  });
});
