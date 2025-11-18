/**
 * Integration tests for vertical-height-readability rule with real-world examples
 */

import { describe, it, expect } from '@jest/globals';
import { verticalHeightReadabilityRule } from '../../src/rules/vertical-height-readability';
import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Vertical Height Readability - Integration Tests', () => {
  describe('Real-World TD Examples', () => {
    it('should detect org chart with excessive depth', async () => {
      const diagram: Diagram = {
        content: `graph TD
          CEO[CEO] --> CTO[CTO]
          CEO --> CFO[CFO]
          CEO --> COO[COO]

          CTO --> VPEng[VP Engineering]
          CTO --> VPProd[VP Product]

          VPEng --> DirBackend[Director Backend]
          VPEng --> DirFrontend[Director Frontend]

          DirBackend --> ManagerAPI[Manager API Team]
          DirBackend --> ManagerDB[Manager DB Team]

          ManagerAPI --> LeadAuth[Lead Auth]
          ManagerAPI --> LeadGateway[Lead Gateway]

          LeadAuth --> DevAuth1[Developer 1]
          LeadAuth --> DevAuth2[Developer 2]

          LeadGateway --> DevGW1[Developer 3]
          LeadGateway --> DevGW2[Developer 4]

          ManagerDB --> LeadDB[Lead DB]
          LeadDB --> DevDB1[Developer 5]
          LeadDB --> DevDB2[Developer 6]`,
        startLine: 1,
        filePath: 'org-chart.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 800, error: 1200 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('vertical-height-readability');
      expect(issue?.message).toContain('graph depth');
      expect(issue?.message).toContain('TD');
      expect(issue?.suggestion).toContain('Break into multiple diagrams');
      expect(issue?.suggestion).toContain('subgraph');
      expect(issue?.suggestion).not.toContain('Convert to LR'); // Should NOT suggest LR
    });

    it('should detect decision tree with many levels', async () => {
      const diagram: Diagram = {
        content: `graph TD
          Start{User Login?} --> Auth{Authenticated?}
          Auth -->|No| Error1[Show Error]
          Auth -->|Yes| Perm{Has Permission?}

          Perm -->|No| Error2[Access Denied]
          Perm -->|Yes| Valid{Data Valid?}

          Valid -->|No| Error3[Validation Failed]
          Valid -->|Yes| Process{Can Process?}

          Process -->|No| Error4[Processing Error]
          Process -->|Yes| Save{Saved?}

          Save -->|No| Error5[Save Failed]
          Save -->|Yes| Notify{Notify?}

          Notify -->|Yes| Send[Send Notification]
          Notify -->|No| Done[Complete]
          Send --> Done`,
        startLine: 1,
        filePath: 'decision-tree.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 800, error: 1200 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.message).toContain('graph depth');
      expect(issue?.suggestion).toContain('Break into multiple diagrams');
    });

    it('should detect file hierarchy with deep nesting', async () => {
      const diagram: Diagram = {
        content: `graph TD
          Root[/] --> Home[home]
          Root --> Usr[usr]
          Root --> Var[var]

          Home --> User[user]
          User --> Docs[Documents]
          Docs --> Projects[Projects]
          Projects --> MyApp[MyApp]
          MyApp --> Src[src]
          Src --> Components[components]
          Components --> Button[Button]
          Button --> Index[index.tsx]
          Button --> Styles[styles.css]
          Button --> Test[test.tsx]

          Usr --> Bin[bin]
          Usr --> Lib[lib]
          Lib --> Node[node_modules]
          Node --> React[react]
          React --> Dist[dist]
          Dist --> ReactJS[react.js]`,
        startLine: 1,
        filePath: 'file-hierarchy.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 800, error: 1200 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.message).toContain('graph depth');
      expect(issue?.suggestion).toContain('layers');
    });
  });

  describe('Real-World LR Examples', () => {
    it('should detect process flow with many parallel branches', async () => {
      const diagram: Diagram = {
        content: `graph LR
          Start[Receive Request] --> ValidateAuth[Validate Auth]

          ValidateAuth --> ProcessA[Process Type A]
          ValidateAuth --> ProcessB[Process Type B]
          ValidateAuth --> ProcessC[Process Type C]
          ValidateAuth --> ProcessD[Process Type D]
          ValidateAuth --> ProcessE[Process Type E]
          ValidateAuth --> ProcessF[Process Type F]
          ValidateAuth --> ProcessG[Process Type G]
          ValidateAuth --> ProcessH[Process Type H]
          ValidateAuth --> ProcessI[Process Type I]
          ValidateAuth --> ProcessJ[Process Type J]

          ProcessA --> Merge[Merge Results]
          ProcessB --> Merge
          ProcessC --> Merge
          ProcessD --> Merge
          ProcessE --> Merge
          ProcessF --> Merge
          ProcessG --> Merge
          ProcessH --> Merge
          ProcessI --> Merge
          ProcessJ --> Merge`,
        startLine: 1,
        filePath: 'process-flow.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('vertical-height-readability');
      expect(issue?.message).toContain('parallel branches');
      expect(issue?.message).toContain('LR');
      expect(issue?.suggestion).toContain('Convert to TD');
      expect(issue?.suggestion).toContain('Group parallel branches');
    });

    it('should detect state machine with many transitions', async () => {
      const diagram: Diagram = {
        content: `graph LR
          Idle --> EventA[Handle Event A]
          Idle --> EventB[Handle Event B]
          Idle --> EventC[Handle Event C]
          Idle --> EventD[Handle Event D]
          Idle --> EventE[Handle Event E]
          Idle --> EventF[Handle Event F]
          Idle --> EventG[Handle Event G]
          Idle --> EventH[Handle Event H]
          Idle --> EventI[Handle Event I]
          Idle --> EventJ[Handle Event J]
          Idle --> EventK[Handle Event K]
          Idle --> EventL[Handle Event L]

          EventA --> Processing
          EventB --> Processing
          EventC --> Processing
          EventD --> Processing
          EventE --> Processing
          EventF --> Processing
          EventG --> Processing
          EventH --> Processing
          EventI --> Processing
          EventJ --> Processing
          EventK --> Processing
          EventL --> Processing`,
        startLine: 1,
        filePath: 'state-machine.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.message).toContain('parallel branches');
      expect(issue?.suggestion).toContain('Convert to TD');
    });
  });

  describe('Coordination with horizontal-width-readability', () => {
    it('should detect diagram that is both too tall and too wide', async () => {
      // This diagram would trigger both vertical-height-readability (deep)
      // and horizontal-width-readability (wide branches)
      const diagram: Diagram = {
        content: `graph TD
          Start[Start Process] --> L1A[Level 1 Branch A with long label]
          Start --> L1B[Level 1 Branch B with long label]
          Start --> L1C[Level 1 Branch C with long label]
          Start --> L1D[Level 1 Branch D with long label]
          Start --> L1E[Level 1 Branch E with long label]
          Start --> L1F[Level 1 Branch F with long label]
          Start --> L1G[Level 1 Branch G with long label]
          Start --> L1H[Level 1 Branch H with long label]

          L1A --> L2A1[Level 2 Deep nested node]
          L2A1 --> L3A1[Level 3 Deep nested node]
          L3A1 --> L4A1[Level 4 Deep nested node]
          L4A1 --> L5A1[Level 5 Deep nested node]
          L5A1 --> L6A1[Level 6 Deep nested node]
          L6A1 --> L7A1[Level 7 Deep nested node]
          L7A1 --> L8A1[Level 8 Deep nested node]
          L8A1 --> L9A1[Level 9 Deep nested node]
          L9A1 --> L10A1[Level 10 Deep nested node]

          L1B --> L2B1[Another deep branch]
          L2B1 --> L3B1[Going deeper]
          L3B1 --> L4B1[Still going]
          L4B1 --> L5B1[More depth]
          L5B1 --> L6B1[Continuing]`,
        startLine: 1,
        filePath: 'complex-diagram.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 400, warning: 800, error: 1200 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      // Should detect height issue
      expect(issue).not.toBeNull();
      expect(['warning', 'error']).toContain(issue?.severity); // Deep diagram
      expect(issue?.suggestion).toContain('Break into multiple diagrams');
    });

    it('should suggest splitting when layout conversion would worsen other dimension', async () => {
      // Deep TD diagram - converting to LR would make it too wide
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
          S --> T`,
        startLine: 1,
        filePath: 'deep-chain.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      // Should NOT suggest converting to LR (would make it too wide)
      expect(issue?.suggestion).not.toContain('Convert to LR');
      // Should suggest breaking up instead
      expect(issue?.suggestion).toContain('Break into multiple diagrams');
    });
  });

  describe('Shallow diagrams (should not trigger)', () => {
    it('should not flag shallow TD org chart', async () => {
      const diagram: Diagram = {
        content: `graph TD
          CEO[CEO] --> CTO[CTO]
          CEO --> CFO[CFO]
          CEO --> COO[COO]

          CTO --> Eng[Engineering]
          CFO --> Fin[Finance]
          COO --> Ops[Operations]`,
        startLine: 1,
        filePath: 'small-org.md',
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

    it('should not flag narrow LR process flow', async () => {
      const diagram: Diagram = {
        content: `graph LR
          Start[Start] --> Process1[Process Step 1]
          Process1 --> Process2[Process Step 2]
          Process2 --> End[End]`,
        startLine: 1,
        filePath: 'simple-flow.md',
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

    it('should not flag moderate LR branching', async () => {
      const diagram: Diagram = {
        content: `graph LR
          Start --> Branch1
          Start --> Branch2
          Start --> Branch3
          Start --> Branch4

          Branch1 --> End
          Branch2 --> End
          Branch3 --> End
          Branch4 --> End`,
        startLine: 1,
        filePath: 'moderate-branches.md',
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

  describe('Custom configuration', () => {
    it('should respect lower targetHeight threshold', async () => {
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
        targetHeight: 200, // Very low threshold
        thresholds: { info: 200, warning: 400, error: 600 },
      };
      const issue = await verticalHeightReadabilityRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      // The message contains estimated height, not target height
      expect(issue?.message).toContain('px');
    });

    it('should respect custom node dimensions', async () => {
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
      const configLarge: RuleConfig = {
        enabled: true,
        nodeHeight: 100,
        verticalSpacing: 100,
        targetHeight: 300,
      };
      const issueLarge = verticalHeightReadabilityRule.check(diagram, metrics, configLarge);

      // With larger nodes, should exceed threshold
      expect(issueLarge).not.toBeNull();

      const configSmall: RuleConfig = {
        enabled: true,
        nodeHeight: 20,
        verticalSpacing: 20,
        targetHeight: 300,
      };
      const issueSmall = verticalHeightReadabilityRule.check(diagram, metrics, configSmall);

      // With smaller nodes, should not exceed threshold
      expect(issueSmall).toBeNull();
    });
  });
});
