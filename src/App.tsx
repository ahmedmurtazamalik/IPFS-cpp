import React, { useState, useEffect, useRef } from "react";
import { ChordRing } from "./dsa/ChordRing";
import type { BTreeKeyValuePair } from "./dsa/BTree";
import { sha1, getLeastBits } from "./dsa/Sha1";
import { ChordRingVisualizer } from "./components/ChordRingVisualizer";
import { BTreeVisualizer } from "./components/BTreeVisualizer";

// Define schema for mock files tracked in UI
interface MockFile {
  fileName: string;
  content: string;
  hash: string;
  key: bigint;
  storedNodeId: bigint;
}

export default function App() {
  // Config state
  const [m, setM] = useState<number>(5);
  const [btreeOrder, setBtreeOrder] = useState<number>(3);

  // Instantiated ChordRing ref
  const ringRef = useRef<ChordRing>(new ChordRing(5, 3));
  const [, setUpdateTrigger] = useState<number>(0);

  // UI Selection & Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<bigint | null>(null);
  const [nodeName, setNodeName] = useState<string>("");
  const [manualNodeId, setManualNodeId] = useState<string>("");

  // File states
  const [fileName, setFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [mockFiles, setMockFiles] = useState<MockFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<BTreeKeyValuePair | null>(null);
  const [searchResultNodeId, setSearchResultNodeId] = useState<bigint | null>(null);

  // Routing Animation state
  const [animatingPath, setAnimatingPath] = useState<bigint[]>([]);
  const [animatingLogs, setAnimatingLogs] = useState<string[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per hop
  const [activeOperation, setActiveOperation] = useState<{
    type: "INSERT" | "SEARCH" | "DELETE";
    payload: any;
  } | null>(null);

  // Tutorial Guide state
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [tutorialSlide, setTutorialSlide] = useState<number>(0);

  // Trigger re-render helper
  const forceUpdate = () => setUpdateTrigger(prev => prev + 1);

  // Initialize ring with default nodes/files from Figure 4 textbook example
  useEffect(() => {
    resetRing(5, 3);
  }, []);

  const resetRing = (bitSpace: number, bTreeM: number) => {
    const ring = new ChordRing(bitSpace, bTreeM);
    ringRef.current = ring;
    setMockFiles([]);
    setSelectedNodeId(null);
    resetRouting();
    forceUpdate();
  };

  // Node operations
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    let manualIdVal: bigint | undefined = undefined;
    if (manualNodeId.trim() !== "") {
      try {
        manualIdVal = BigInt(manualNodeId);
        const maxVal = ringRef.current.getMaxSpace();
        if (manualIdVal < 0n || manualIdVal >= maxVal) {
          alert(`Manual ID must be between 0 and ${maxVal - 1n}`);
          return;
        }
      } catch (err) {
        alert("Please enter a valid numeric integer for the ID.");
        return;
      }
    }

    const newNode = ringRef.current.addNode(nodeName, manualIdVal);
    setSelectedNodeId(newNode.id);
    setNodeName("");
    setManualNodeId("");
    syncMockFiles();
    forceUpdate();
  };

  const handleRemoveNode = (id: bigint) => {
    ringRef.current.removeNode(id);
    if (selectedNodeId === id) {
      setSelectedNodeId(ringRef.current.nodes[0]?.id ?? null);
    }
    syncMockFiles();
    forceUpdate();
  };

  const handleAutoPopulate = () => {
    const ring = new ChordRing(m, btreeOrder);
    ringRef.current = ring;

    const nodeNames = [
      "google.com", 
      "wikipedia.org", 
      "github.com", 
      "stackoverflow.com",
      "reddit.com", 
      "netflix.com", 
      "amazon.com", 
      "apple.com"
    ];

    const maxSpace = ring.getMaxSpace();
    const numNodes = nodeNames.length;

    nodeNames.forEach((name, i) => {
      let nodeId: bigint;
      if (m === 4) {
        nodeId = BigInt(i * 2 + 1);
      } else if (m === 5) {
        const space5Ids = [1n, 4n, 9n, 11n, 14n, 18n, 22n, 28n];
        nodeId = space5Ids[i % space5Ids.length];
      } else if (m === 8) {
        nodeId = BigInt(Math.floor((i / numNodes) * 256) + 5);
      } else {
        const hash = sha1(name);
        nodeId = getLeastBits(hash, m);
      }
      ring.addNode(name, nodeId % maxSpace);
    });

    const filePresets = [
      { fileName: "whitepaper.txt", content: "InterPlanetary File System (IPFS) is a peer-to-peer hypermedia protocol designed to preserve and grow humanity's knowledge by making the web upgradeable, resilient, and more open." },
      { fileName: "bitcoin.pdf", content: "A Peer-to-Peer Electronic Cash System. A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution." },
      { fileName: "index.html", content: "<!DOCTYPE html><html><head><title>InterPlanetary File System</title></head><body><h1>Welcome to InterPlanetary File System!</h1></body></html>" },
      { fileName: "dataset.csv", content: "id,name,value\n1,Alice,100\n2,Bob,200\n3,Charlie,300\n4,David,400\n5,Eve,500" },
      { fileName: "config.json", content: '{\n  "identity": "QmHash",\n  "addresses": {\n    "swarm": ["/ip4/0.0.0.0/tcp/4001"]\n  }\n}' },
      { fileName: "notes.txt", content: "Remember to review data structures: B-Trees for disk indexing and Chord DHT for network routing. Fall 2023 CS2001." },
      { fileName: "main.py", content: "def main():\n    print('Hello from the InterPlanetary File System')\nif __name__ == '__main__':\n    main()" },
      { fileName: "style.css", content: "body {\n  background: #09090e;\n  color: #e2e8f0;\n  font-family: sans-serif;\n}" },
      { fileName: "todo.md", content: "# Todo List\n- [x] Implement Chord Ring\n- [x] Implement B-Tree\n- [ ] Deploy to Vercel" },
      { fileName: "hello.txt", content: "Hello, World! This is a simple test file stored inside the InterPlanetary File System (IPFS) DHT." }
    ];

    filePresets.forEach(file => {
      const hash = sha1(file.content);
      const key = getLeastBits(hash, m);
      const targetNode = ring.findSuccessor(key);
      targetNode.btree.insert({
        key,
        fileName: file.fileName,
        content: file.content,
        hash,
      });
    });

    syncMockFiles();

    if (ring.nodes.length > 0) {
      setSelectedNodeId(ring.nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }

    resetRouting();
    forceUpdate();
  };

  // Sync internal BTrees files with UI files tracker
  const syncMockFiles = () => {
    const list: MockFile[] = [];
    ringRef.current.nodes.forEach(node => {
      node.btree.getAllPairs().forEach(pair => {
        list.push({
          fileName: pair.fileName,
          content: pair.content,
          hash: pair.hash,
          key: pair.key,
          storedNodeId: node.id,
        });
      });
    });
    setMockFiles(list);
  };

  // Routing Animation Controller Timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && currentPathIndex < animatingPath.length - 1) {
      timer = setTimeout(() => {
        setCurrentPathIndex(prev => prev + 1);
      }, playbackSpeed);
    } else if (currentPathIndex === animatingPath.length - 1 && isPlaying) {
      setIsPlaying(false);
      onRoutingFinished();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentPathIndex, animatingPath, playbackSpeed]);

  const startRoutingAnimation = (path: bigint[], logs: string[], opType: "INSERT" | "SEARCH" | "DELETE", payload: any) => {
    setAnimatingPath(path);
    setAnimatingLogs(logs);
    setCurrentPathIndex(0);
    setActiveOperation({ type: opType, payload });
    setIsPlaying(true);
  };

  const stepForward = () => {
    if (currentPathIndex < animatingPath.length - 1) {
      setCurrentPathIndex(prev => prev + 1);
      if (currentPathIndex + 1 === animatingPath.length - 1) {
        onRoutingFinished();
      }
    }
  };

  const resetRouting = () => {
    setAnimatingPath([]);
    setAnimatingLogs([]);
    setCurrentPathIndex(-1);
    setIsPlaying(false);
    setActiveOperation(null);
  };

  // Triggers once the query package physically lands on the target node
  const onRoutingFinished = () => {
    if (!activeOperation) return;

    const ring = ringRef.current;
    const { type, payload } = activeOperation;

    if (type === "INSERT") {
      const { fileName, fileContent, key, hash } = payload;
      const targetNode = ring.findSuccessor(key);
      targetNode.btree.insert({
        key,
        fileName,
        content: fileContent,
        hash,
      });
      syncMockFiles();
      setSelectedNodeId(targetNode.id);
      alert(`File uploaded! Key ${key} stored in Node ${targetNode.id}'s B-Tree.`);
    } else if (type === "SEARCH") {
      const { key } = payload;
      const targetNode = ring.findSuccessor(key);
      const found = targetNode.btree.search(key);
      setSearchResult(found);
      setSearchResultNodeId(targetNode.id);
      if (found) {
        setSelectedNodeId(targetNode.id);
      } else {
        alert("Search complete: File key not found in the B-Tree of the responsible node.");
      }
    } else if (type === "DELETE") {
      const { key } = payload;
      const targetNode = ring.findSuccessor(key);
      targetNode.btree.delete(key);
      syncMockFiles();
      setSelectedNodeId(targetNode.id);
      alert(`File deleted from Node ${targetNode.id}'s B-Tree.`);
    }

    // Retain paths but terminate active op to prevent re-execution
    setActiveOperation(null);
    forceUpdate();
  };

  // Upload new file handler
  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (ringRef.current.nodes.length === 0) {
      alert("Please add at least one active machine/node to the Ring DHT before uploading files.");
      return;
    }
    if (!fileName.trim() || !fileContent.trim()) {
      alert("Please provide both a filename and content.");
      return;
    }

    const hash = sha1(fileContent);
    const key = getLeastBits(hash, m);

    // Pick start node (use selected node, or fallback to first node)
    const startNode = nodesList.find(n => n.id === selectedNodeId) || nodesList[0];

    // Compute route path
    const { path, logs } = ringRef.current.routeQuery(startNode.id, key);

    // Start routing simulation
    startRoutingAnimation(path, logs, "INSERT", { fileName, fileContent, key, hash });

    // Clear inputs
    setFileName("");
    setFileContent("");
  };

  // Search/Retrieve file handler
  const handleSearchFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (ringRef.current.nodes.length === 0) return;
    if (!searchQuery.trim()) return;

    let key: bigint;
    try {
      if (searchQuery.toLowerCase().startsWith("0x")) {
        key = BigInt(searchQuery);
      } else if (/^\d+$/.test(searchQuery)) {
        key = BigInt(searchQuery);
      } else {
        // If query is a text string, search by hashing it
        const hash = sha1(searchQuery);
        key = getLeastBits(hash, m);
      }
    } catch (err) {
      alert("Invalid search key. Enter an integer or file content string.");
      return;
    }

    const startNode = nodesList.find(n => n.id === selectedNodeId) || nodesList[0];
    const { path, logs } = ringRef.current.routeQuery(startNode.id, key);

    setSearchResult(null);
    setSearchResultNodeId(null);
    startRoutingAnimation(path, logs, "SEARCH", { key });
  };

  // Delete file handler
  const handleDeleteFile = (key: bigint) => {
    const startNode = nodesList.find(n => n.id === selectedNodeId) || nodesList[0];
    const { path, logs } = ringRef.current.routeQuery(startNode.id, key);

    setSearchResult(null);
    startRoutingAnimation(path, logs, "DELETE", { key });
  };

  // Trigger real file download in user's browser
  const downloadFile = (file: { fileName: string; content: string }) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = file.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  // Accessor list sorted by ID for lists
  const nodesList = ringRef.current.nodes;
  const selectedNode = nodesList.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="app-container">
      {/* Background neon glows */}
      <div className="neon-blob blob-purple"></div>
      <div className="neon-blob blob-blue"></div>

      {/* Header */}
      <header className="app-header glass-panel">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px var(--color-secondary-glow))" }}>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/>
              <path d="m12 2 8 8-8 8-8-8 8-8Z"/>
              <circle cx="12" cy="10" r="2" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h1>InterPlanetary File System (IPFS) Ring DHT &amp; B-Tree Simulation</h1>
            <p className="subtitle">Interactive Data Structures visualizer running entirely client-side</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => { setShowTutorial(true); setTutorialSlide(0); }} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            Guide
          </button>
          <div className="header-badge">
            Active Space Size: 2<sup>{m}</sup> ({nodesList.length} Nodes)
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="app-grid">
        {/* Left Column: Network Settings & Control Center */}
        <section className="col-controls">
          {/* Config Setup */}
          <div className="glass-panel panel-padding">
            <h2>System Parameters</h2>
            <div className="config-row">
              <div className="form-group">
                <label>Identifier Bits (m)</label>
                <select
                  value={m}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setM(val);
                    resetRing(val, btreeOrder);
                  }}
                  disabled={currentPathIndex !== -1 && isPlaying}
                >
                  <option value={4}>4 bits (Space 16)</option>
                  <option value={5}>5 bits (Space 32)</option>
                  <option value={8}>8 bits (Space 256)</option>
                  <option value={160}>160 bits (SHA-1)</option>
                </select>
              </div>

              <div className="form-group">
                <label>B-Tree Order (M)</label>
                <select
                  value={btreeOrder}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setBtreeOrder(val);
                    resetRing(m, val);
                  }}
                  disabled={currentPathIndex !== -1 && isPlaying}
                >
                  <option value={3}>Order 3 (Max: 2)</option>
                  <option value={4}>Order 4 (Max: 3)</option>
                  <option value={5}>Order 5 (Max: 4)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={handleAutoPopulate}
                className="btn-secondary btn-full"
                disabled={currentPathIndex !== -1 && isPlaying}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.886H3.877l4.918 3.573L6.883 18.35 12 14.777l5.117 3.573-1.912-5.89 4.918-3.573h-6.211L12 3z" fill="currentColor"/>
                </svg>
                Auto-Populate Network
              </button>
              <button
                onClick={() => resetRing(m, btreeOrder)}
                className="btn-danger btn-full"
                disabled={currentPathIndex !== -1 && isPlaying}
              >
                Reset Simulation Ring
              </button>
            </div>
          </div>

          {/* Node Management */}
          <div className="glass-panel panel-padding mt-4">
            <h2>Machine Control Center</h2>
            <form onSubmit={handleAddNode} className="form-node-add">
              <div className="form-group">
                <label>Machine Name</label>
                <input
                  type="text"
                  placeholder="e.g. google.com"
                  value={nodeName}
                  onChange={e => setNodeName(e.target.value)}
                  disabled={currentPathIndex !== -1 && isPlaying}
                />
              </div>
              <div className="form-group">
                <label>Manual ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-hash"
                  value={manualNodeId}
                  onChange={e => setManualNodeId(e.target.value)}
                  disabled={currentPathIndex !== -1 && isPlaying}
                />
              </div>
              <button
                type="submit"
                className="btn-primary btn-full mt-2"
                disabled={currentPathIndex !== -1 && isPlaying}
              >
                Add Machine to Ring
              </button>
            </form>

            <div className="active-nodes-list-container">
              <h3>Active Nodes List ({nodesList.length})</h3>
              {nodesList.length === 0 ? (
                <p className="no-items-text">No active machines in the ring.</p>
              ) : (
                <div className="active-nodes-scroll">
                  {nodesList.map(node => (
                    <div
                      key={node.id.toString()}
                      className={`active-node-item ${selectedNodeId === node.id ? "active" : ""}`}
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <div className="node-id-badge">
                        ID: {m === 160 ? `0x${node.id.toString(16).slice(0, 8)}...` : node.id.toString()}
                      </div>
                      <div className="node-meta">
                        <span className="node-name">{node.name}</span>
                        <span className="node-keys-count">({node.btree.getAllPairs().length} files)</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveNode(node.id);
                        }}
                        className="btn-remove-node"
                        title="Remove machine from DHT gracefully"
                        disabled={currentPathIndex !== -1 && isPlaying}
                        style={{ fontSize: "1.2rem", color: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Center Column: Chord Ring Visualizer & Console logs */}
        <section className="col-dht">
          {/* Ring Canvas */}
          <div className="glass-panel panel-padding relative flex-center-col min-h-ring">
            <h2>Chord DHT Circular Space</h2>
            {nodesList.length === 0 ? (
              <div className="empty-ring-placeholder">
                <div className="placeholder-pulse" style={{ color: "var(--color-danger)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <p>The Chord ring is empty. Please add nodes from the left panel to begin.</p>
              </div>
            ) : (
              <ChordRingVisualizer
                m={m}
                nodes={nodesList}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                activePath={animatingPath}
                currentPathIndex={currentPathIndex}
              />
            )}

            {/* Animation Controls overlay */}
            {animatingPath.length > 0 && (
              <div className="animation-controller glass-panel">
                <div className="anim-status-label">
                  Hops Traversing: <span className="neon-text">{currentPathIndex + 1} / {animatingPath.length}</span>
                </div>
                <div className="anim-buttons">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn-control"
                    title={isPlaying ? "Pause Routing" : "Resume Routing"}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {isPlaying ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Play
                      </>
                    )}
                  </button>
                  <button
                    onClick={stepForward}
                    className="btn-control"
                    disabled={isPlaying || currentPathIndex === animatingPath.length - 1}
                    title="Step Forward 1 Hop"
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                    Step
                  </button>
                  <button onClick={resetRouting} className="btn-control" title="Clear path" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    Reset
                  </button>
                </div>
                <div className="speed-slider">
                  <label>Speed: {playbackSpeed}ms</label>
                  <input
                    type="range"
                    min="300"
                    max="3000"
                    step="100"
                    value={playbackSpeed}
                    onChange={e => setPlaybackSpeed(parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Simulation Console Trace logs */}
          <div className="glass-panel panel-padding mt-4 flex-grow-1 flex-col">
            <h2>Simulation Routing Trace Console</h2>
            <div className="console-logs-container">
              {animatingLogs.length === 0 ? (
                <div className="empty-console">
                  <p className="text-muted">Console idle. Perform a file lookup or upload to see DHT hops...</p>
                </div>
              ) : (
                <div className="console-scroll">
                  {animatingLogs.map((log, idx) => {
                    const isPassed = idx <= currentPathIndex;
                    const isActive = idx === currentPathIndex;
                    return (
                      <div
                        key={idx}
                        className={`console-log-line ${isPassed ? "passed" : ""} ${isActive ? "active" : ""}`}
                      >
                        <span className="log-index">[{idx + 1}]</span>
                        <span className="log-text">{log}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Files & Node Local B-Tree Inspector */}
        <section className="col-inspect">
          {/* B-Tree Visualization */}
          <div className="glass-panel panel-padding flex-col">
            <div className="inspect-header">
              <h2>Machine B-Tree Index Inspector</h2>
              {selectedNode && (
                <div className="selected-node-tag">
                  Node {m === 160 ? `0x${selectedNode.id.toString(16).slice(0, 8)}...` : selectedNode.id.toString()}
                </div>
              )}
            </div>

            {selectedNode ? (
              <BTreeVisualizer
                tree={selectedNode.btree}
                highlightKey={
                  animatingPath.length > 0 && currentPathIndex === animatingPath.length - 1
                    ? (activeOperation?.payload?.key as bigint)
                    : null
                }
              />
            ) : (
              <div className="btree-empty">
                <p>Select a machine from the circular ring or list to view its local B-Tree storage index.</p>
              </div>
            )}
          </div>

          {/* Filesystem panel */}
          <div className="glass-panel panel-padding mt-4">
            <h2>InterPlanetary File System (IPFS) File Manager</h2>

            <div className="file-tabs-container">
              {/* File Insertion tab */}
              <div className="tab-section">
                <h3>Insert File</h3>
                <form onSubmit={handleUploadFile} className="form-file-upload">
                  <div className="form-group">
                    <label>Filename</label>
                    <input
                      type="text"
                      placeholder="e.g. data_set.csv"
                      value={fileName}
                      onChange={e => setFileName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Text Content</label>
                    <textarea
                      placeholder="Enter file contents here..."
                      rows={2}
                      value={fileContent}
                      onChange={e => setFileContent(e.target.value)}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-secondary btn-full mt-2">
                    Publish to InterPlanetary File System (IPFS) (DHT Route & Store)
                  </button>
                </form>
              </div>

              {/* File Lookup tab */}
              <div className="tab-section mt-4">
                <h3>Search File</h3>
                <form onSubmit={handleSearchFile} className="form-file-search">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Enter File content, Key (Int) or Hex"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                      Search
                    </button>
                  </div>
                </form>

                {searchResult && (
                  <div className="search-result-box glass-panel mt-2">
                    <div className="result-header">
                      <span className="result-found-tag">Found File</span>
                      <span className="result-node-tag">Stored in Node {searchResultNodeId?.toString()}</span>
                    </div>
                    <div className="result-body">
                      <p><strong>Filename:</strong> {searchResult.fileName}</p>
                      <p><strong>Key ID:</strong> {searchResult.key.toString()}</p>
                      <p className="result-hash"><strong>SHA-1:</strong> {searchResult.hash}</p>
                      <div className="result-content-box">"{searchResult.content}"</div>
                      <button
                        onClick={() => downloadFile(searchResult)}
                        className="btn-primary btn-full mt-2"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download Mock Text File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic list of tracked files */}
              <div className="tab-section mt-4">
                <h3>Tracked InterPlanetary File System (IPFS) Files ({mockFiles.length})</h3>
                {mockFiles.length === 0 ? (
                  <p className="no-items-text">No files published to this InterPlanetary File System (IPFS) ring yet.</p>
                ) : (
                  <div className="files-table-container">
                    <table className="files-table">
                      <thead>
                        <tr>
                          <th>Filename</th>
                          <th>Key ID</th>
                          <th>Node</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockFiles.map((file, idx) => (
                          <tr key={idx}>
                            <td>{file.fileName}</td>
                            <td className="font-mono">
                              {m === 160 ? `0x${file.key.toString(16).slice(0, 4)}..` : file.key.toString()}
                            </td>
                            <td>{file.storedNodeId.toString()}</td>
                            <td className="cell-actions">
                              <button
                                onClick={() => downloadFile(file)}
                                className="btn-icon"
                                title="Download File"
                                style={{ color: "var(--color-secondary)" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.key)}
                                className="btn-icon"
                                title="Delete File"
                                style={{ color: "var(--color-danger)" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTutorial(false)}>×</button>
            
            {tutorialSlide === 0 && (
              <div className="tutorial-slide">
                <h2>What is the InterPlanetary File System (IPFS)?</h2>
                <p>Standard web servers fetch files using <strong>Location Addressing</strong> (e.g. <code>https://server.com/image.png</code>). If that server goes down, the file is lost.</p>
                <p>IPFS solves this using <strong>Content Addressing</strong>. Every file is represented by a unique hash of its contents (SHA-1 in this simulation). You retrieve the file by asking for its hash key, regardless of which machine stores it.</p>
                <div className="tutorial-diagram">
                  <span>File content: "Hello"</span> &rarr; <span>SHA-1 Hash</span> &rarr; <span>Key ID: 12</span>
                </div>
              </div>
            )}

            {tutorialSlide === 1 && (
              <div className="tutorial-slide">
                <h2>The Ring DHT (Distributed Hash Table)</h2>
                <p>To avoid storing all files on one server, files are geo-distributed across multiple participating machines.</p>
                <p>We map both files and machines into a <strong>circular identifier space</strong> from <code>0</code> to <code>2<sup>m</sup>-1</code>. A file is stored on the first active node whose ID is greater than or equal to the file's hash key. This node is called the <strong>successor</strong> of the key.</p>
                <p>For example, in a 5-bit space (keys 0-31), a file with key <code>12</code> is stored at Node <code>14</code> (its successor).</p>
              </div>
            )}

            {tutorialSlide === 2 && (
              <div className="tutorial-slide">
                <h2>Routing Shortcuts: Finger Tables</h2>
                <p>If queries only hopped to direct successors, finding a file would take <code>O(N)</code> hops (slow). Instead, Chord DHT nodes maintain a **Routing Table** (Finger Table) of size <code>m</code>.</p>
                <p>The <code>i</code>-th entry of node <code>p</code> points to the successor of <code>p + 2<sup>i-1</sup> mod 2<sup>m</sup></code>. These shortcuts let queries skip across the ring, routing requests in only <strong>O(log N) hops</strong>!</p>
                <p>Hover over any active node in the circle to see its fingers light up as shortcuts passing through the interior.</p>
              </div>
            )}

            {tutorialSlide === 3 && (
              <div className="tutorial-slide">
                <h2>Node Storage: B-Trees</h2>
                <p>When a machine receives a file, it must store and index it efficiently on its local drive. Chord nodes use **B-Trees** for local indexing.</p>
                <p>A B-Tree is a self-balancing search tree designed to optimize read and write operations on block storage by grouping multiple keys inside single node boxes.</p>
                <p>Click on any active machine to inspect its local B-Tree dynamically. You can watch nodes split or merge when files are added or deleted.</p>
              </div>
            )}

            {tutorialSlide === 4 && (
              <div className="tutorial-slide">
                <h2>Interactive Guide: Try it Out</h2>
                <ul>
                  <li style={{ marginBottom: "0.5rem" }}><strong>Add Nodes</strong>: Enter a name (e.g. google.com) and click Add. The system will hash it to locate its spot on the ring.</li>
                  <li style={{ marginBottom: "0.5rem" }}><strong>Upload File</strong>: Provide content. The system hashes it and routes it starting from your selected node.</li>
                  <li style={{ marginBottom: "0.5rem" }}><strong>Observe Routing</strong>: Use the play/pause controllers on the ring to animate the packet hopping across shortcuts in real time.</li>
                  <li style={{ marginBottom: "0.5rem" }}><strong>Graceful Leaves</strong>: Remove any node; see its keys redistribute to its successor automatically.</li>
                </ul>
              </div>
            )}

            <div className="modal-footer mt-4">
              <div className="progress-dots">
                {[0, 1, 2, 3, 4].map(idx => (
                  <span 
                    key={idx} 
                    className={`dot ${tutorialSlide === idx ? "active" : ""}`}
                    onClick={() => setTutorialSlide(idx)}
                  ></span>
                ))}
              </div>
              <div className="footer-nav">
                {tutorialSlide > 0 && (
                  <button onClick={() => setTutorialSlide(s => s - 1)} className="btn-control" style={{ marginRight: "0.5rem" }}>
                    Back
                  </button>
                )}
                {tutorialSlide < 4 ? (
                  <button onClick={() => setTutorialSlide(s => s + 1)} className="btn-primary">
                    Next
                  </button>
                ) : (
                  <button onClick={() => setShowTutorial(false)} className="btn-primary">
                    Finish Guide
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
