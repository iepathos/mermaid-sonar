/**
 * Unit tests for class diagram parser
 */

import { parseClassDiagram } from '../../src/graph/class-parser';

describe('Class Parser', () => {
  describe('Class Definition Parsing', () => {
    it('should parse simple class definition', () => {
      const content = `
classDiagram
    class Animal
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(1);
      expect(result.classes.has('Animal')).toBe(true);
      const animal = result.classes.get('Animal')!;
      expect(animal.name).toBe('Animal');
      expect(animal.attributes).toHaveLength(0);
      expect(animal.methods).toHaveLength(0);
    });

    it('should parse class with block syntax', () => {
      const content = `
classDiagram
    class Animal {
        +name: string
        +makeSound()
    }
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(1);
      const animal = result.classes.get('Animal')!;
      expect(animal.attributes).toHaveLength(1);
      expect(animal.methods).toHaveLength(1);
    });

    it('should parse class with colon syntax for members', () => {
      const content = `
classDiagram
    class Dog
    Dog : +name: string
    Dog : +breed: string
    Dog : +bark()
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(1);
      const dog = result.classes.get('Dog')!;
      expect(dog.attributes).toHaveLength(2);
      expect(dog.methods).toHaveLength(1);
    });

    it('should parse multiple classes', () => {
      const content = `
classDiagram
    class Animal
    class Dog
    class Cat
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(3);
      expect(result.classes.has('Animal')).toBe(true);
      expect(result.classes.has('Dog')).toBe(true);
      expect(result.classes.has('Cat')).toBe(true);
    });

    it('should parse generic/template class syntax', () => {
      const content = `
classDiagram
    class List~String~
    class Map~Key,Value~
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(2);
      expect(result.classes.has('List~String~')).toBe(true);
      expect(result.classes.has('Map~Key,Value~')).toBe(true);
    });

    it('should skip comment lines', () => {
      const content = `
classDiagram
    %% This is a comment
    class Animal
    %% Another comment
    class Dog
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(2);
      expect(result.classes.has('Animal')).toBe(true);
      expect(result.classes.has('Dog')).toBe(true);
    });
  });

  describe('Member Parsing', () => {
    it('should parse attributes and methods in block syntax', () => {
      const content = `
classDiagram
    class Person {
        +name: string
        +age: number
        +getName()
        +setAge(newAge: number)
    }
`;
      const result = parseClassDiagram(content);

      const person = result.classes.get('Person')!;
      expect(person.attributes).toHaveLength(2);
      expect(person.methods).toHaveLength(2);
      expect(person.attributes).toContain('+name: string');
      expect(person.attributes).toContain('+age: number');
      expect(person.methods).toContain('+getName()');
      expect(person.methods).toContain('+setAge(newAge: number)');
    });

    it('should parse visibility modifiers in block syntax', () => {
      const content = `
classDiagram
    class BankAccount {
        +publicField: string
        -privateField: number
        #protectedField: boolean
        ~packageField: any
    }
`;
      const result = parseClassDiagram(content);

      const account = result.classes.get('BankAccount')!;
      expect(account.attributes).toHaveLength(4);
      expect(account.attributes).toContain('+publicField: string');
      expect(account.attributes).toContain('-privateField: number');
      expect(account.attributes).toContain('#protectedField: boolean');
      expect(account.attributes).toContain('~packageField: any');
    });

    it('should distinguish methods from attributes by parentheses', () => {
      const content = `
classDiagram
    class Service {
        +config: Config
        +initialize()
        +getData(): Data
    }
`;
      const result = parseClassDiagram(content);

      const service = result.classes.get('Service')!;
      expect(service.attributes).toHaveLength(1);
      expect(service.methods).toHaveLength(2);
      expect(service.attributes[0]).toContain('config');
      expect(service.methods[0]).toContain('initialize()');
      expect(service.methods[1]).toContain('getData()');
    });

    it('should handle empty classes', () => {
      const content = `
classDiagram
    class Empty {
    }
`;
      const result = parseClassDiagram(content);

      const empty = result.classes.get('Empty')!;
      expect(empty.attributes).toHaveLength(0);
      expect(empty.methods).toHaveLength(0);
    });
  });

  describe('Relationship Parsing', () => {
    it('should parse inheritance relationships', () => {
      const content = `
classDiagram
    Animal <|-- Dog
    Animal <|-- Cat
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[0].type).toBe('inheritance');
      expect(result.relationships[0].from).toBe('Dog');
      expect(result.relationships[0].to).toBe('Animal');
      expect(result.relationships[1].type).toBe('inheritance');
      expect(result.relationships[1].from).toBe('Cat');
      expect(result.relationships[1].to).toBe('Animal');
    });

    it('should parse composition relationships', () => {
      const content = `
classDiagram
    Car *-- Engine
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].type).toBe('composition');
      expect(result.relationships[0].from).toBe('Car');
      expect(result.relationships[0].to).toBe('Engine');
    });

    it('should parse aggregation relationships', () => {
      const content = `
classDiagram
    Department o-- Employee
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].type).toBe('aggregation');
      expect(result.relationships[0].from).toBe('Department');
      expect(result.relationships[0].to).toBe('Employee');
    });

    it('should parse association relationships', () => {
      const content = `
classDiagram
    Student --> Course
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].type).toBe('association');
      expect(result.relationships[0].from).toBe('Student');
      expect(result.relationships[0].to).toBe('Course');
    });

    it('should parse dependency relationships', () => {
      const content = `
classDiagram
    Controller ..> Service
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].type).toBe('dependency');
      expect(result.relationships[0].from).toBe('Controller');
      expect(result.relationships[0].to).toBe('Service');
    });

    it('should parse relationship labels', () => {
      const content = `
classDiagram
    Animal <|-- Dog : extends
    Car *-- Engine : contains
`;
      const result = parseClassDiagram(content);

      expect(result.relationships[0].label).toBe('extends');
      expect(result.relationships[1].label).toBe('contains');
    });

    it('should parse multiplicity in associations', () => {
      const content = `
classDiagram
    Student "1" --> "many" Course
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].multiplicity?.from).toBe('1');
      expect(result.relationships[0].multiplicity?.to).toBe('many');
    });

    it('should parse association without multiplicity', () => {
      const content = `
classDiagram
    Teacher --> Student
`;
      const result = parseClassDiagram(content);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].type).toBe('association');
    });
  });

  describe('Graph Building', () => {
    it('should build graph with nodes from classes', () => {
      const content = `
classDiagram
    class A
    class B
    class C
`;
      const result = parseClassDiagram(content);

      expect(result.graph.nodes).toContain('A');
      expect(result.graph.nodes).toContain('B');
      expect(result.graph.nodes).toContain('C');
      expect(result.graph.nodes).toHaveLength(3);
    });

    it('should build graph with edges from relationships', () => {
      const content = `
classDiagram
    A <|-- B
    B --> C
`;
      const result = parseClassDiagram(content);

      expect(result.graph.edges).toHaveLength(2);
      expect(result.graph.edges[0].from).toBe('B');
      expect(result.graph.edges[0].to).toBe('A');
      expect(result.graph.edges[1].from).toBe('B');
      expect(result.graph.edges[1].to).toBe('C');
    });

    it('should build adjacency list from relationships', () => {
      const content = `
classDiagram
    A --> B
    B --> C
    A --> C
`;
      const result = parseClassDiagram(content);

      expect(result.graph.adjacencyList.get('A')).toContain('B');
      expect(result.graph.adjacencyList.get('A')).toContain('C');
      expect(result.graph.adjacencyList.get('B')).toContain('C');
    });

    it('should build reverse adjacency list', () => {
      const content = `
classDiagram
    A --> B
    B --> C
    A --> C
`;
      const result = parseClassDiagram(content);

      expect(result.graph.reverseAdjacencyList.get('B')).toContain('A');
      expect(result.graph.reverseAdjacencyList.get('C')).toContain('A');
      expect(result.graph.reverseAdjacencyList.get('C')).toContain('B');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty diagram', () => {
      const content = `
classDiagram
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(0);
      expect(result.relationships).toHaveLength(0);
      expect(result.graph.nodes).toHaveLength(0);
    });

    it('should handle classes defined only in relationships', () => {
      const content = `
classDiagram
    A <|-- B
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(0);
      expect(result.relationships).toHaveLength(1);
    });

    it('should handle mixed definition styles', () => {
      const content = `
classDiagram
    class Animal {
        +name: string
    }
    Dog : +breed: string
    Animal <|-- Dog
`;
      const result = parseClassDiagram(content);

      expect(result.classes.size).toBe(2);
      expect(result.classes.get('Animal')!.attributes).toHaveLength(1);
      expect(result.classes.get('Dog')!.attributes).toHaveLength(1);
      expect(result.relationships).toHaveLength(1);
    });

    it('should handle namespace syntax', () => {
      const content = `
classDiagram
    namespace Animals {
        class Dog
        class Cat
    }
`;
      const result = parseClassDiagram(content);

      expect(result.classes.has('Dog')).toBe(true);
      expect(result.classes.has('Cat')).toBe(true);
    });
  });
});
