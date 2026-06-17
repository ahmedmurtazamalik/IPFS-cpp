import { BTree } from "./BTree";

export class ChordNode {
  id: bigint;
  name: string;
  successor: ChordNode;
  predecessor: ChordNode | null;
  fingerTable: ChordNode[];
  btree: BTree;
  isOn: boolean;

  constructor(id: bigint, name: string, btreeOrder: number = 3) {
    this.id = id;
    this.name = name;
    this.successor = this;
    this.predecessor = null;
    this.fingerTable = [];
    this.btree = new BTree(btreeOrder);
    this.isOn = true;
  }
}

export class ChordRing {
  m: number; // Identifier space bit size (e.g. 4, 5, 8, 160)
  nodes: ChordNode[]; // Active nodes sorted by ID
  btreeOrder: number;

  constructor(m: number = 4, btreeOrder: number = 3) {
    this.m = m;
    this.nodes = [];
    this.btreeOrder = btreeOrder;
  }

  // Returns max value in identifier space (2^m)
  getMaxSpace(): bigint {
    return 1n << BigInt(this.m);
  }

  // Circular modulo comparison: checks if x lies in (a, b]
  inHalfOpenInterval(x: bigint, a: bigint, b: bigint): boolean {
    if (a === b) {
      return true; // Single node handles entire space
    }
    if (a < b) {
      return x > a && x <= b;
    } else {
      // Interval wraps around
      return x > a || x <= b;
    }
  }

  // Circular modulo comparison: checks if x lies in (a, b)
  inOpenInterval(x: bigint, a: bigint, b: bigint): boolean {
    if (a === b) {
      return x !== a; // Everything except the single point
    }
    if (a < b) {
      return x > a && x < b;
    } else {
      // Interval wraps around
      return x > a || x < b;
    }
  }

  // Returns the active node responsible for a given key (smallest active id >= key)
  findSuccessor(key: bigint): ChordNode {
    if (this.nodes.length === 0) {
      throw new Error("No nodes in the Chord ring");
    }
    for (const node of this.nodes) {
      if (node.id >= key) {
        return node;
      }
    }
    // Wraps around to the first node
    return this.nodes[0];
  }

  // Adds a node to the ring, initializes finger table, and transfers keys from successor
  addNode(name: string, manualId?: bigint): ChordNode {
    const maxSpace = this.getMaxSpace();
    let id: bigint;

    if (manualId !== undefined) {
      id = manualId % maxSpace;
    } else {
      let candidate = 1n;
      while (this.nodes.some(n => n.id === candidate)) {
        candidate++;
      }
      id = candidate % maxSpace;
    }

    // Resolve duplicate ID by incrementing
    if (this.nodes.some(n => n.id === id)) {
      let newId = id;
      for (let i = 0n; i < maxSpace; i++) {
        newId = (newId + 1n) % maxSpace;
        if (!this.nodes.some(n => n.id === newId)) {
          id = newId;
          break;
        }
      }
    }

    const node = new ChordNode(id, name, this.btreeOrder);

    if (this.nodes.length === 0) {
      node.successor = node;
      node.predecessor = node;
      this.nodes.push(node);
    } else {
      // Find insertion position to keep nodes list sorted by ID
      let insertIndex = 0;
      while (insertIndex < this.nodes.length && this.nodes[insertIndex].id < id) {
        insertIndex++;
      }
      this.nodes.splice(insertIndex, 0, node);

      // Link predecessor and successor
      const idx = this.nodes.indexOf(node);
      const nextIdx = (idx + 1) % this.nodes.length;
      const prevIdx = (idx - 1 + this.nodes.length) % this.nodes.length;

      const succNode = this.nodes[nextIdx];
      const predNode = this.nodes[prevIdx];

      node.successor = succNode;
      node.predecessor = predNode;
      succNode.predecessor = node;
      predNode.successor = node;

      // Gracefully redistribute keys:
      // Transfer files from succNode to the new node if their keys are in (predNode.id, node.id]
      const succPairs = succNode.btree.getAllPairs();
      for (const pair of succPairs) {
        if (this.inHalfOpenInterval(pair.key, predNode.id, node.id)) {
          node.btree.insert(pair);
          succNode.btree.delete(pair.key);
        }
      }
    }

    this.updateFingerTables();
    return node;
  }

  // Gracefully removes a node from the ring and transfers its keys to its successor
  removeNode(id: bigint) {
    const index = this.nodes.findIndex(n => n.id === id);
    if (index === -1) return;

    const node = this.nodes[index];
    const succNode = node.successor;
    const predNode = node.predecessor;

    // Transfer all keys to the successor node
    const pairs = node.btree.getAllPairs();
    for (const pair of pairs) {
      succNode.btree.insert(pair);
    }

    // Unlink the node
    if (this.nodes.length === 1) {
      this.nodes = [];
    } else {
      this.nodes.splice(index, 1);
      predNode!.successor = succNode;
      succNode.predecessor = predNode;
    }

    this.updateFingerTables();
  }

  // Recalculates finger tables for all active nodes in the ring
  updateFingerTables() {
    const maxSpace = this.getMaxSpace();
    for (const node of this.nodes) {
      node.fingerTable = [];
      for (let i = 0; i < this.m; i++) {
        const targetId = (node.id + (1n << BigInt(i))) % maxSpace;
        node.fingerTable[i] = this.findSuccessor(targetId);
      }
    }
  }

  // Simulates step-by-step query routing in Chord DHT and returns path and log details
  routeQuery(startNodeId: bigint, key: bigint): { path: bigint[]; logs: string[] } {
    const path: bigint[] = [];
    const logs: string[] = [];

    const startNode = this.nodes.find(n => n.id === startNodeId);
    if (!startNode) {
      logs.push(`Error: Start node ${startNodeId} is not active in the ring.`);
      return { path, logs };
    }

    let curr = startNode;

    let steps = 0;
    const maxSteps = this.nodes.length + 2; // Safeguard against infinite loops

    while (steps < maxSteps) {
      path.push(curr.id);

      const predId = curr.predecessor ? curr.predecessor.id : curr.id;

      if (this.nodes.length === 1) {
        logs.push(`Node ${curr.id} is the only active node in the ring. Key ${key} maps directly here.`);
        break;
      }

      // Check if current node is responsible (key in (predecessor, current])
      if (this.inHalfOpenInterval(key, predId, curr.id)) {
        logs.push(`Key ${key} lies in interval (${predId}, ${curr.id}]. Node ${curr.id} is responsible and handles the request.`);
        break;
      }

      // Find closest preceding node in finger table
      let nextNode = curr.successor;
      let fingerIndex = -1;

      for (let i = this.m - 1; i >= 0; i--) {
        const finger = curr.fingerTable[i];
        if (finger) {
          if (this.inOpenInterval(finger.id, curr.id, key)) {
            nextNode = finger;
            fingerIndex = i;
            break;
          }
        }
      }

      if (fingerIndex !== -1) {
        logs.push(`Node ${curr.id} routing table entry ${fingerIndex + 1} (Node ${nextNode.id}) is the closest preceding node in circular interval (${curr.id}, ${key}). Forwarding query to Node ${nextNode.id}.`);
      } else {
        logs.push(`No shortcuts in Node ${curr.id}'s routing table precede key ${key} circular interval. Forwarding to its direct successor Node ${nextNode.id}.`);
      }

      curr = nextNode;
      steps++;
    }

    if (steps >= maxSteps) {
      logs.push(`Routing terminated: possible infinite loop detected (transiently unstable network).`);
    }

    return { path, logs };
  }
}
