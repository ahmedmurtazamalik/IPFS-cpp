export interface BTreeKeyValuePair {
  key: bigint;
  fileName: string;
  content: string;
  hash: string; // 160-bit SHA-1 hex
}

export class BTreeNode {
  keys: BTreeKeyValuePair[];
  children: BTreeNode[];
  isLeaf: boolean;

  constructor(isLeaf: boolean = true) {
    this.keys = [];
    this.children = [];
    this.isLeaf = isLeaf;
  }

  // Helper to clone a node (useful for UI tracking or immutability in React state if needed)
  clone(): BTreeNode {
    const node = new BTreeNode(this.isLeaf);
    node.keys = [...this.keys];
    node.children = this.children.map(c => c.clone());
    return node;
  }
}

export class BTree {
  root: BTreeNode | null;
  order: number; // Max children (M)
  minKeys: number; // Math.ceil(M / 2) - 1
  maxKeys: number; // M - 1

  constructor(order: number = 3) {
    this.root = null;
    this.order = order;
    this.maxKeys = order - 1;
    this.minKeys = Math.ceil(order / 2) - 1;
  }

  // Searches for a key in the B-Tree
  search(key: bigint, node: BTreeNode | null = this.root): BTreeKeyValuePair | null {
    if (!node) return null;

    let i = 0;
    while (i < node.keys.length && key > node.keys[i].key) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i].key) {
      return node.keys[i];
    }

    if (node.isLeaf) {
      return null;
    }

    return this.search(key, node.children[i]);
  }

  // Inserts a key-value pair into the B-Tree
  insert(pair: BTreeKeyValuePair) {
    if (!this.root) {
      this.root = new BTreeNode(true);
      this.root.keys.push(pair);
      return;
    }

    const r = this.root;
    if (r.keys.length === this.maxKeys) {
      const s = new BTreeNode(false);
      this.root = s;
      s.children.push(r);
      this.splitChild(s, 0, r);
      this.insertNonFull(s, pair);
    } else {
      this.insertNonFull(r, pair);
    }
  }

  private insertNonFull(node: BTreeNode, pair: BTreeKeyValuePair) {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Find position to insert key and shift larger keys
      node.keys.push(pair); // temporary push to expand array
      while (i >= 0 && node.keys[i].key > pair.key) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = pair;
    } else {
      // Find the child to descend into
      while (i >= 0 && node.keys[i].key > pair.key) {
        i--;
      }
      i++;

      const child = node.children[i];
      if (child.keys.length === this.maxKeys) {
        this.splitChild(node, i, child);
        if (pair.key > node.keys[i].key) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], pair);
    }
  }

  private splitChild(parent: BTreeNode, index: number, child: BTreeNode) {
    const t = Math.floor((this.order - 1) / 2); // Split point
    const middleIndex = t;
    const middleKey = child.keys[middleIndex];

    const nextNode = new BTreeNode(child.isLeaf);

    // Distribute keys: right half goes to nextNode
    nextNode.keys = child.keys.slice(middleIndex + 1);
    child.keys = child.keys.slice(0, middleIndex);

    // Distribute children if not leaf
    if (!child.isLeaf) {
      nextNode.children = child.children.slice(middleIndex + 1);
      child.children = child.children.slice(0, middleIndex + 1);
    }

    // Insert new child in parent
    parent.children.splice(index + 1, 0, nextNode);
    // Insert middle key in parent
    parent.keys.splice(index, 0, middleKey);
  }

  // Deletes a key from the B-Tree
  delete(key: bigint) {
    if (!this.root) return;

    this.deleteKey(this.root, key);

    // If root has 0 keys and has a child, make the child the new root
    if (this.root.keys.length === 0) {
      if (this.root.isLeaf) {
        this.root = null;
      } else {
        this.root = this.root.children[0];
      }
    }
  }

  private deleteKey(node: BTreeNode, key: bigint) {
    const index = this.findKeyIndex(node, key);

    // Case 1: Key is present in this node
    if (index < node.keys.length && node.keys[index].key === key) {
      if (node.isLeaf) {
        // Case 1a: Key is in a leaf node, simply remove it
        node.keys.splice(index, 1);
      } else {
        // Case 1b: Key is in an internal node
        this.deleteFromInternal(node, index);
      }
    } else {
      // Case 2: Key is not present in this node
      if (node.isLeaf) {
        // Key is not in the tree
        return;
      }

      const isLastChild = (index === node.keys.length);
      const child = node.children[index];

      // If child has less than minKeys, we must balance it first
      if (child.keys.length < this.minKeys) {
        this.fill(node, index);
      }

      // After fill, the child might have merged, which changes indexes
      if (isLastChild && index > node.keys.length) {
        this.deleteKey(node.children[index - 1], key);
      } else {
        this.deleteKey(node.children[index], key);
      }
    }
  }

  private findKeyIndex(node: BTreeNode, key: bigint): number {
    let index = 0;
    while (index < node.keys.length && node.keys[index].key < key) {
      index++;
    }
    return index;
  }

  private deleteFromInternal(node: BTreeNode, index: number) {
    const pair = node.keys[index];
    const leftChild = node.children[index];
    const rightChild = node.children[index + 1];

    if (leftChild.keys.length >= this.minKeys + 1) {
      // Find predecessor key in leftChild subtree
      const pred = this.getPredecessor(leftChild);
      node.keys[index] = pred;
      this.deleteKey(leftChild, pred.key);
    } else if (rightChild.keys.length >= this.minKeys + 1) {
      // Find successor key in rightChild subtree
      const succ = this.getSuccessor(rightChild);
      node.keys[index] = succ;
      this.deleteKey(rightChild, succ.key);
    } else {
      // Both children have only minKeys, merge key and rightChild into leftChild
      this.merge(node, index);
      this.deleteKey(leftChild, pair.key);
    }
  }

  private getPredecessor(node: BTreeNode): BTreeKeyValuePair {
    let curr = node;
    while (!curr.isLeaf) {
      curr = curr.children[curr.children.length - 1];
    }
    return curr.keys[curr.keys.length - 1];
  }

  private getSuccessor(node: BTreeNode): BTreeKeyValuePair {
    let curr = node;
    while (!curr.isLeaf) {
      curr = curr.children[0];
    }
    return curr.keys[0];
  }

  // Borrow/Merge wrapper to balance child node at index
  private fill(node: BTreeNode, index: number) {
    if (index !== 0 && node.children[index - 1].keys.length >= this.minKeys + 1) {
      this.borrowFromPrev(node, index);
    } else if (index !== node.keys.length && node.children[index + 1].keys.length >= this.minKeys + 1) {
      this.borrowFromNext(node, index);
    } else {
      if (index !== node.keys.length) {
        this.merge(node, index);
      } else {
        this.merge(node, index - 1);
      }
    }
  }

  private borrowFromPrev(node: BTreeNode, index: number) {
    const child = node.children[index];
    const sibling = node.children[index - 1];

    // Shift keys in child to make room for parent key
    child.keys.unshift(node.keys[index - 1]);

    // Move child's parent key to be sibling's last key
    node.keys[index - 1] = sibling.keys.pop()!;

    // Move sibling's last child pointer to child's first child pointer
    if (!child.isLeaf) {
      child.children.unshift(sibling.children.pop()!);
    }
  }

  private borrowFromNext(node: BTreeNode, index: number) {
    const child = node.children[index];
    const sibling = node.children[index + 1];

    // Child gets the parent key
    child.keys.push(node.keys[index]);

    // Parent gets sibling's first key
    node.keys[index] = sibling.keys.shift()!;

    // Child gets sibling's first child pointer
    if (!child.isLeaf) {
      child.children.push(sibling.children.shift()!);
    }
  }

  private merge(node: BTreeNode, index: number) {
    const child = node.children[index];
    const sibling = node.children[index + 1];

    // Push parent separator key to child
    child.keys.push(node.keys[index]);

    // Move sibling keys to child
    child.keys.push(...sibling.keys);

    // Move sibling child pointers to child
    if (!child.isLeaf) {
      child.children.push(...sibling.children);
    }

    // Remove separator key and sibling pointer from parent
    node.keys.splice(index, 1);
    node.children.splice(index + 1, 1);
  }

  // Returns all Key-Value pairs in sorted order
  getAllPairs(node: BTreeNode | null = this.root): BTreeKeyValuePair[] {
    if (!node) return [];

    const pairs: BTreeKeyValuePair[] = [];
    const traverse = (n: BTreeNode) => {
      let i = 0;
      for (i = 0; i < n.keys.length; i++) {
        if (!n.isLeaf) traverse(n.children[i]);
        pairs.push(n.keys[i]);
      }
      if (!n.isLeaf) traverse(n.children[i]);
    };

    traverse(node);
    return pairs;
  }
}
