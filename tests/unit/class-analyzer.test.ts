/**
 * Unit tests for class diagram analyzer
 */

import type { Diagram } from '../../src/extractors/types';
import {
  analyzeClassDiagram,
  estimateClassDiagramWidth,
  estimateClassDiagramHeight,
} from '../../src/analyzers/class-analyzer';

describe('Class Analyzer', () => {
  describe('Class Width Calculation', () => {
    it('should calculate width based on longest member', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal {
        +name: string
        +veryLongMethodNameWithParameters(param1: Type, param2: Type): ReturnType
    }
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxClassWidth).toBeGreaterThan(60);
    });

    it('should handle classes with no members', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Empty
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.avgClassWidth).toBeGreaterThan(0);
      expect(analysis.maxClassWidth).toBeGreaterThan(0);
    });

    it('should calculate average width across multiple classes', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Short {
        +x: int
    }
    class VeryLongClassName {
        +veryLongAttributeName: string
    }
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.avgClassWidth).toBeGreaterThan(0);
      expect(analysis.maxClassWidth).toBeGreaterThan(analysis.avgClassWidth);
    });
  });

  describe('Class Height Calculation', () => {
    it('should calculate height based on member count', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Person {
        +name: string
        +age: number
        +email: string
        +getName()
        +getAge()
        +setEmail(email: string)
    }
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxClassHeight).toBe(7);
    });

    it('should count class name as part of height', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Empty
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxClassHeight).toBe(1);
    });

    it('should calculate average height across classes', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Small {
        +x: int
    }
    class Large {
        +a: string
        +b: string
        +c: string
        +d: string
        +method1()
        +method2()
        +method3()
    }
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.avgClassHeight).toBeGreaterThan(1);
      expect(analysis.maxClassHeight).toBe(8);
    });
  });

  describe('Inheritance Level Calculation', () => {
    it('should calculate single level for flat hierarchy', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    class C
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxInheritanceDepth).toBe(1);
      expect(analysis.levelWidths).toEqual([3]);
    });

    it('should calculate multiple levels for inheritance hierarchy', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal
    class Mammal
    class Dog
    Animal <|-- Mammal
    Mammal <|-- Dog
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxInheritanceDepth).toBe(3);
      expect(analysis.levelWidths).toEqual([1, 1, 1]);
    });

    it('should calculate width at each level', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal
    class Dog
    class Cat
    class Bird
    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxInheritanceDepth).toBe(2);
      expect(analysis.levelWidths).toEqual([1, 3]);
    });

    it('should handle complex multi-level hierarchy', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal
    class Mammal
    class Reptile
    class Dog
    class Cat
    class Snake
    class Lizard
    Animal <|-- Mammal
    Animal <|-- Reptile
    Mammal <|-- Dog
    Mammal <|-- Cat
    Reptile <|-- Snake
    Reptile <|-- Lizard
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxInheritanceDepth).toBe(3);
      expect(analysis.levelWidths).toEqual([1, 2, 4]);
    });

    it('should ignore non-inheritance relationships', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    class C
    A --> B
    B *-- C
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.maxInheritanceDepth).toBe(1);
      expect(analysis.levelWidths).toEqual([3]);
    });
  });

  describe('Relationship Density', () => {
    it('should calculate density as relationships per class', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    class C
    A --> B
    B --> C
    A --> C
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.relationshipDensity).toBe(1);
    });

    it('should handle zero relationships', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.relationshipDensity).toBe(0);
    });

    it('should handle high density', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    A <|-- B
    A --> B
    A *-- B
    A o-- B
    A ..> B
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);

      expect(analysis.relationshipDensity).toBe(2.5);
    });
  });

  describe('Width Estimation', () => {
    it('should estimate width based on widest inheritance level', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal
    class Dog
    class Cat
    class Bird
    class Fish
    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird
    Animal <|-- Fish
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const width = estimateClassDiagramWidth(analysis);

      expect(width).toBeGreaterThan(500);
    });

    it('should account for class box width', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class VeryLongClassNameWithManyCharacters {
        +veryLongAttributeNameThatExceedsNormalLength: string
    }
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const width = estimateClassDiagramWidth(analysis);

      expect(width).toBeGreaterThan(400);
    });

    it('should return reasonable width for empty diagram', () => {
      const diagram: Diagram = {
        type: 'class',
        content: 'classDiagram',
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const width = estimateClassDiagramWidth(analysis);

      expect(width).toBe(0);
    });
  });

  describe('Height Estimation', () => {
    it('should estimate height based on inheritance depth', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    class C
    class D
    A <|-- B
    B <|-- C
    C <|-- D
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const height = estimateClassDiagramHeight(analysis);

      expect(height).toBeGreaterThan(200);
    });

    it('should account for class member count', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Parent {
        +attr1: string
        +attr2: string
        +attr3: string
        +method1()
        +method2()
        +method3()
    }
    class Child {
        +childAttr: string
        +childMethod()
    }
    Parent <|-- Child
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const height = estimateClassDiagramHeight(analysis);

      expect(height).toBeGreaterThan(100);
    });

    it('should return reasonable height for flat hierarchy', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    class C
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const analysis = analyzeClassDiagram(diagram);
      const height = estimateClassDiagramHeight(analysis);

      expect(height).toBeGreaterThan(0);
      expect(height).toBeLessThan(200);
    });
  });
});
