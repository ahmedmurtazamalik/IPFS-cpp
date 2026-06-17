# 🪐 InterPlanetary File System (IPFS) & Chord DHT Simulator

[![Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://ipfs-sim.vercel.app/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

An interactive, premium web-based visualization of a **Ring Distributed Hash Table (DHT)** and **B-Tree indexing system**, simulating the core routing and storage architectures of **IPFS (InterPlanetary File System)**. 

This project simulates how files are content-addressed, routed across a peer-to-peer network, and stored locally inside individual machines. It is built as a complete TypeScript-based simulation and visualizer, with an accompanying C++ reference codebase.

*   **Live Web Application:** [https://ipfs-sim.vercel.app/](https://ipfs-sim.vercel.app/)

---

## 📖 Table of Contents
1. [Non-Technical Explanation](#-non-technical-explanation-what-is-this)
2. [Technical Architecture](#-technical-architecture-how-it-works)
    - [Circular Identifier Space](#1-circular-identifier-space)
    - [Finger Table Routing](#2-finger-table-routing-routing-table)
    - [Local Node Storage (B-Trees)](#3-local-node-storage-b-trees)
    - [Dynamic Re-scaling and Key Redistribution](#4-dynamic-re-scaling-and-graceful-key-redistribution)
3. [Repository File Structure](#-repository-file-structure)
4. [Interactive Web Simulator Features](#-interactive-web-simulator-features)
5. [Local Development Setup](#-local-development-setup)
6. [C++ Reference Codebase](#-c-reference-codebase)

---

## 🧑‍💻 Non-Technical Explanation: What is this?

### The Problem: Traditional Location-Based Web
Normally, when you access a file on the internet (like a photo or a video), you request it from a specific computer at a specific address (e.g., `http://server.com/my-photo.jpg`). This is **Location-Based Addressing**. 
*   **The Flaw:** If that server crashes, gets blocked, or goes offline, your photo is lost forever—even if millions of other people have copies of that exact same photo on their own computers.

### The Solution: Content-Based Addressing & InterPlanetary File System (IPFS)
The InterPlanetary File System (IPFS) changes this by using **Content-Based Addressing**. Instead of asking *where* a file is, you ask for the file by *what* it is. 
1.  **Unique Fingerprints (Hashing):** Every file gets run through a mathematical formula that generates a unique "fingerprint" (a hash key, like a book's ISBN code) based *only* on its content. If you change even one letter in a file, its fingerprint changes completely.
2.  **Distributed Post Offices (DHT):** Instead of storing all files on one giant central computer, files are scattered across many different computers (nodes) around the world. To find out who has which file, the nodes form a circular ring. 
3.  **Smart Routing (Finger Tables):** When you want a file, you ask any computer in the ring. Using a built-in directory booklet (routing table), computers pass your request along the shortest path until it hits the machine responsible for storing that file.
4.  **Local Filing Cabinets (B-Trees):** Once the file request reaches the right computer, that machine needs to find the file quickly on its own hard drive. It uses a structured filing cabinet (a **B-Tree**) to search through its local index in a split second.

---

## 🛠️ Technical Architecture: How it Works

The project simulates a **Chord Ring DHT** combined with **local node-level B-Trees** for data indexing.

```
                  [Chord Ring space: 0 to 2^m - 1]
                            Node 0 (00)
                           .     |     .
                        .        |        .
                      .     Key 2 (stored)  .
                    .            |            .
          Node 28 (11100) -------+------- Node 4 (00100)
                    .                         .
                     .                       .
                      .                     .
                       .     Node 14 (01110)
```

### 1. Circular Identifier Space
Both **files (keys)** and **machines (nodes)** are mapped onto a circular ring of size $2^m$ identifiers ($0 \le \text{ID} < 2^m$):
*   **Nodes:** Hashed using their names (e.g., `google.com`) and mapped onto the ring: 
    $$\text{Node ID} = \text{SHA-1}(\text{Name}) \pmod{2^m}$$
*   **Files:** Hashed by their content: 
    $$\text{File Key} = \text{SHA-1}(\text{Content}) \pmod{2^m}$$
*   **Storage Rules (Successor):** A file with key $e$ is stored on the node with the smallest identifier $p \ge e$ (wrapping around to the first node if $e$ is larger than all node IDs). This node $p$ is called the **successor** of key $e$, denoted as $\text{succ}(e)$.

### 2. Finger Table Routing (Routing Table)
If nodes only knew their immediate neighbors (successors), routing queries around the ring would take $O(N)$ hops (linear search). To route in logarithmic time ($O(\log N)$), each node $p$ maintains a **Finger Table** containing $m$ shortcuts:
$$\text{Finger}[i] = \text{succ}(p + 2^{i-1}) \pmod{2^m} \quad \text{for } 1 \le i \le m$$

*   When a node receives a query for key $e$, it checks if the key belongs locally.
*   If not, it looks up its finger table to find the closest active node that precedes $e$, skipping large chunks of the circular ring and routing the request in **$O(\log N)$ hops**.

### 3. Local Node Storage (B-Trees)
Once a request arrives at the responsible node, the node retrieves the file from its disk. To keep local lookups efficient, files are indexed using a **B-Tree** inside each node:
*   A **B-Tree** of order $M$ is a self-balancing search tree where each node can have multiple keys and children.
*   This keeps search, insertion, and deletion times at $O(\log K)$ locally (where $K$ is the number of keys stored on the node).
*   Keys are kept sorted, and nodes split or merge when they exceed maximum or fall below minimum key constraints.

### 4. Dynamic Re-scaling and Graceful Key Redistribution
*   **Node Join:** When a new machine joins the ring, it calculates its ID, updates the routing tables across the ring, and pulls the keys it is now responsible for from its successor node (the range $( \text{predecessor}, \text{new\_node\_id} ]$).
*   **Node Leave:** When a machine leaves gracefully, all of its local B-Tree keys are transferred to its successor before it detaches, ensuring zero data loss in the network.

---

## 📁 Repository File Structure

Here is a breakdown of the codebase:

```
├── .gitignore
├── DS_Project.md               # Original academic assignment requirements
├── index.html                  # Main HTML Entry Point
├── package.json                # npm scripts & project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundle configuration
│
├── cpp_reference/              # Reference C++ Console Implementation
│   ├── BTree.h                 # Templated B-Tree class
│   ├── DHT.h                   # Distributed Hash Table node manager
│   ├── KVP.h                   # Key-Value Pair structure definition
│   ├── Leastbits.h             # Bit extraction helper from SHA-1 hash
│   ├── LinkedList.h            # Doubly & circular linked lists for routing
│   ├── RT.h                    # Routing Table / Finger Table definitions
│   ├── Sha1.hpp                # SHA-1 computation functions
│   └── try.cpp                 # Main execution & CLI demonstration
│
└── src/                        # React Frontend & TS Simulator
    ├── main.tsx                # React application bootstrapper
    ├── App.tsx                 # Core UI container, controllers, and state
    ├── App.css                 # Supplemental layout styling
    ├── index.css               # Core styling (vibrant dark glassmorphism)
    │
    ├── dsa/                    # Pure TypeScript Data Structures
    │   ├── BTree.ts            # Local node memory storage (B-Tree logic)
    │   ├── ChordRing.ts        # Circular ring, finger tables, and routing engine
    │   └── Sha1.ts             # Custom SHA-1 hash generator and bit extractors
    │
    └── components/             # Visual rendering components
        ├── BTreeVisualizer.tsx # Dynamic SVG-based B-Tree visual generator
        └── ChordRingVisualizer.tsx # SVG circular ring with animated packets
```

---

## 🎮 Interactive Web Simulator Features

The web frontend ([ipfs-sim.vercel.app](https://ipfs-sim.vercel.app/)) provides a visual interface to see these concepts in action:
*   **Dynamic Canvas Space ($2^m$):** Configure identifier spaces (from 4-bit simulation up to 160-bit SHA-1 hashes) and B-Tree order parameters.
*   **Interactive Chord Ring:** Visually inspect nodes, successor paths, and predecessor links. Hover over nodes to highlight their routing table finger tables.
*   **Real-time Package Routing Animations:** Step through routing query packets (Insert, Delete, Search) hop-by-hop as they leap across finger table shortcuts.
*   **B-Tree Visual Inspector:** Click on any node to render its complete, live B-Tree. Watch node split and merge animations as files are inserted or removed.
*   **Simulation Console:** Trace logs show the exact circular interval mathematical steps used to route requests.
*   **Dynamic File uploads:** Upload text files, view their content addresses, search for files, and download files locally.

---

## 🚀 Local Development Setup

To run this simulation on your local machine, ensure you have [Node.js](https://nodejs.org/) installed:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ahmedmurtazamalik/IPFS.git
    cd IPFS
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start Dev Server:**
    ```bash
    npm run dev
    ```
    This will spin up a local server (usually at `http://localhost:5173`). Open the URL in your browser to play with the simulation.

4.  **Build production package:**
    ```bash
    npm run build
    ```
    This compiles the app into high-performance web assets inside the `dist` directory, ready to deploy.

---

## 💻 C++ Reference Codebase
For native performance testing, the `cpp_reference/` directory contains an academic implementation of the same DHT Ring and B-Tree rules. It is built to run on **Visual Studio 2019 / MSVC** or any standard C++17 compiler:
*   It implements circular singly linked lists for machines.
*   The routing tables are modeled as doubly linked lists.
*   It supports CLI commands to add/remove machines, publish files, print local B-Trees, and show routing paths.

*To compile the C++ reference using `g++`:*
```bash
cd cpp_reference
g++ -std=c++17 try.cpp -o ipfs_sim
./ipfs_sim
```
