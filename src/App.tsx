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

    if (bitSpace === 5) {
      // Textbook figure 4 initialization: Nodes 1, 4, 9, 11, 14, 28
      ring.addNode("Node_1", 1n);
      ring.addNode("Node_4", 4n);
      ring.addNode("Node_9", 9n);
      ring.addNode("Node_11", 11n);
      ring.addNode("Node_14", 14n);
      ring.addNode("Node_28", 28n);

      // Add sample files
      // Key = hash(content) % 32
      // Let's create specific content that hashes to interesting keys:
      // "wizard_of_oz" -> we can manually force key insertion or map correctly:
      const file1Text = "Follow the yellow brick road! Discover the Wizard of Oz in Emerald City.";
      const hash1 = sha1(file1Text);
      const key1 = getLeastBits(hash1, 5); // key 12. Successor is Node 14.

      const file2Text = "IPFS protocol uses Distributed Hash Tables for content-addressed routing.";
      const hash2 = sha1(file2Text);
      const key2 = getLeastBits(hash2, 5); // key 26. Successor is Node 28.

      const file3Text = "B-Trees keep indexes balanced for fast O(log N) searches in distributed storage nodes.";
      const hash3 = sha1(file3Text);
      const key3 = getLeastBits(hash3, 5); // key 2. Successor is Node 4.

      // Store them directly
      const node14 = ring.findSuccessor(key1);
      node14.btree.insert({ key: key1, fileName: "wizard_of_oz.txt", content: file1Text, hash: hash1 });

      const node28 = ring.findSuccessor(key2);
      node28.btree.insert({ key: key2, fileName: "ipfs_intro.txt", content: file2Text, hash: hash2 });

      const node4 = ring.findSuccessor(key3);
      node4.btree.insert({ key: key3, fileName: "btree_dsa.txt", content: file3Text, hash: hash3 });

      setMockFiles([
        { fileName: "wizard_of_oz.txt", content: file1Text, hash: hash1, key: key1, storedNodeId: node14.id },
        { fileName: "ipfs_intro.txt", content: file2Text, hash: hash2, key: key2, storedNodeId: node28.id },
        { fileName: "btree_dsa.txt", content: file3Text, hash: hash3, key: key3, storedNodeId: node4.id },
      ]);
      setSelectedNodeId(28n); // Default selection
    } else {
      setMockFiles([]);
      setSelectedNodeId(null);
    }
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
          <div className="logo-icon">🪐</div>
          <div>
            <h1>IPFS Ring DHT & B-Tree Simulation</h1>
            <p className="subtitle">Interactive Data Structures visualizer running entirely client-side</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => { setShowTutorial(true); setTutorialSlide(0); }} className="btn-secondary">
            📖 Guide
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
            <h2>⚙️ System Parameters</h2>
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
                  <option value={4}>4 bits (Space: 16)</option>
                  <option value={5}>5 bits (Space: 32)</option>
                  <option value={8}>8 bits (Space: 256)</option>
                  <option value={160}>160 bits (SHA-1 Space)</option>
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
                  <option value={3}>Order 3 (Max Keys: 2)</option>
                  <option value={4}>Order 4 (Max Keys: 3)</option>
                  <option value={5}>Order 5 (Max Keys: 4)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => resetRing(m, btreeOrder)}
              className="btn-danger btn-full"
              disabled={currentPathIndex !== -1 && isPlaying}
            >
              Reset Simulation Ring
            </button>
          </div>

          {/* Node Management */}
          <div className="glass-panel panel-padding mt-4">
            <h2>🖥️ Machine Control Center</h2>
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
                      >
                        ❌
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
          <div className="glass-panel panel-padding relative overflow-hidden flex-center-col min-h-ring">
            <h2>🌌 Chord DHT Circular Space</h2>
            {nodesList.length === 0 ? (
              <div className="empty-ring-placeholder">
                <div className="placeholder-pulse">⚠️</div>
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
                  >
                    {isPlaying ? "⏸️ Pause" : "▶️ Play"}
                  </button>
                  <button
                    onClick={stepForward}
                    className="btn-control"
                    disabled={isPlaying || currentPathIndex === animatingPath.length - 1}
                    title="Step Forward 1 Hop"
                  >
                    ⏭️ Step
                  </button>
                  <button onClick={resetRouting} className="btn-control" title="Clear path">
                    🔄 Reset
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
            <h2>📟 Simulation Routing Trace Console</h2>
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
              <h2>🌳 Machine B-Tree Index Inspector</h2>
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
            <h2>📂 IPFS File Manager</h2>

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
                    Publish to IPFS (DHT Route & Store)
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
                      >
                        📥 Download Mock Text File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic list of tracked files */}
              <div className="tab-section mt-4">
                <h3>Tracked IPFS Files ({mockFiles.length})</h3>
                {mockFiles.length === 0 ? (
                  <p className="no-items-text">No files published to this IPFS ring yet.</p>
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
                              >
                                📥
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.key)}
                                className="btn-icon"
                                title="Delete File"
                              >
                                🗑️
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
                <h2>🪐 What is the InterPlanetary File System (IPFS)?</h2>
                <p>Standard web servers fetch files using <strong>Location Addressing</strong> (e.g. <code>https://server.com/image.png</code>). If that server goes down, the file is lost.</p>
                <p>IPFS solves this using <strong>Content Addressing</strong>. Every file is represented by a unique hash of its contents (SHA-1 in this simulation). You retrieve the file by asking for its hash key, regardless of which machine stores it.</p>
                <div className="tutorial-diagram">
                  <span>File content: "Hello"</span> ➡️ <span>SHA-1 Hash</span> ➡️ <span>Key ID: 12</span>
                </div>
              </div>
            )}

            {tutorialSlide === 1 && (
              <div className="tutorial-slide">
                <h2>🌌 The Ring DHT (Distributed Hash Table)</h2>
                <p>To avoid storing all files on one server, files are geo-distributed across multiple participating machines.</p>
                <p>We map both files and machines into a <strong>circular identifier space</strong> from <code>0</code> to <code>2<sup>m</sup>-1</code>. A file is stored on the first active node whose ID is greater than or equal to the file's hash key. This node is called the <strong>successor</strong> of the key.</p>
                <p>For example, in a 5-bit space (keys 0-31), a file with key <code>12</code> is stored at Node <code>14</code> (its successor).</p>
              </div>
            )}

            {tutorialSlide === 2 && (
              <div className="tutorial-slide">
                <h2>⚡ Routing Shortcuts: Finger Tables</h2>
                <p>If queries only hopped to direct successors, finding a file would take <code>O(N)</code> hops (slow). Instead, Chord DHT nodes maintain a **Routing Table** (Finger Table) of size <code>m</code>.</p>
                <p>The <code>i</code>-th entry of node <code>p</code> points to the successor of <code>p + 2<sup>i-1</sup> mod 2<sup>m</sup></code>. These shortcuts let queries skip across the ring, routing requests in only <strong>O(log N) hops</strong>!</p>
                <p>Hover over any active node in the circle to see its fingers light up as shortcuts passing through the interior.</p>
              </div>
            )}

            {tutorialSlide === 3 && (
              <div className="tutorial-slide">
                <h2>🌳 Node Storage: B-Trees</h2>
                <p>When a machine receives a file, it must store and index it efficiently on its local drive. Chord nodes use **B-Trees** for local indexing.</p>
                <p>A B-Tree is a self-balancing search tree designed to optimize read and write operations on block storage by grouping multiple keys inside single node boxes.</p>
                <p>Click on any active machine to inspect its local B-Tree dynamically. You can watch nodes split or merge when files are added or deleted.</p>
              </div>
            )}

            {tutorialSlide === 4 && (
              <div className="tutorial-slide">
                <h2>🎮 Interactive Guide: Try it Out</h2>
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
